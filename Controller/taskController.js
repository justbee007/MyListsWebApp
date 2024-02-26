const env = process.env;
const db = require('../config/sequelizeDB.js');
const User = db.users;
const Lists = db.lists;
const Tasks = db.tasks;
const Comments = db.comments;
const Reminder = db.reminders;
const Tags = db.tags;
const Tasktags = db.tasktags;
const logger = require('../config/logger');
const {
    v4: uuidv4
} = require('uuid');
const { sqlRequestDurationMicroseconds } = require('../routes/router');

const { Client } = require('@elastic/elasticsearch')
const fs = require("fs");
const Kafka = require('node-rdkafka');

const producer = Kafka.Producer.createWriteStream({
    'metadata.broker.list': env.KAFKA_BROKER
}, {}, {
    topic: env.KAFKA_TOPIC
})

const client = new Client({
    node: env.ELASTIC_ENDPOINT
})

client.info().then(console.log, console.log)


const queueMessage = async (data) => {
    // console.log(data)
    console.log('Message published to Kafka topic: ', env.KAFKA_TOPIC)
    let search = await client.search({
        index: 'task',
        query: {
            match: { id: data.id }
        }
    })
    const searchData = { search_id: search.hits.hits[0]._id, ...data}
    const event = {
        index: 'task',
        ...searchData
    }
    console.log(Buffer.from(JSON.stringify(event)))
    const result = producer.write(Buffer.from(JSON.stringify(event)))
    if (result) {
        console.log(result)
        console.log('We queued our message!');
    } else
        console.log('Too many messages in our queue already');
}

async function checkValidity(req, res, field) {
    console.log('check valid ' + field)
    if (!req.body[field]) {
        console.error('error updating list')
        return res.status(400).send({
            message: 'Error Updating the List try passing ' + field + ' in body'
        });
        return true;
    }
}

async function checkListIdBelongToUser(req, res) {
    const lists = await getListByUsernameAndID(req.user.email, req.body.listId)

    if (lists == '') {
        console.warn('Invalid listId for this user')
        res.status(400).send({
            message: 'Invalid listId for this user'
        });
        return true
    }
}

async function checkValidStatus(req, res) {
    console.log('checkValidStatus', req.body.state, req.body.state != 'TODO' && req.body.state != 'COMPLETE' && req.body.state != 'OVERDUE')
    if (req.body.state != 'TODO' && req.body.state != 'COMPLETE' && req.body.state != 'OVERDUE') {
        console.warn('Invalid state for task, try passing TODO, COMPLETE, OVERDUE')
        res.status(400).send({
            
            message: 'Invalid state for task, try passing TODO, COMPLETE, OVERDUE'
        });
        return true
    }
}

async function checkValidStatusDate(req, res) {
    console.log("checkValidStatusDate", req.body.dueDate);
    const date1 = new Date(req.body.dueDate);
    const date2 = new Date();
    const diffTime = date1 - date2;
    console.log(date1, date2.setHours(0, 0, 0, 0), diffTime);
    var currstate = req.body.state;

    if (currstate != 'COMPLETE' && diffTime < 0) {
        currstate = "OVERDUE"
    }
    if (currstate != 'COMPLETE' && diffTime > 0) {
        currstate = "TODO"
    }
    // console.log(currstate)
    sqlRequestDurationMicroseconds
    .labels('sql-logs')
    .observe(5);
    Tasks.update({
        state: currstate
    }, {
        where: {
            id: req.body.taskId
        }
    }).then((result) => {
        // console.log('result', result);
        return false
    }).catch(err => {
        console.error('Error Updating the task')
        // console.log('error checkValidStatusDate', err);
        res.status(500).send({
            message: 'Error Updating the task'
        });
        return true;
    });

}

async function createTask(req, res, next) {
    console.log('create task')
    if (await checkValidity(req, res, 'listId') && await checkListIdBelongToUser(req, res) && await checkValidity(req, res, 'task')) {
        return;
    }
    if (await checkListIdBelongToUser(req, res)) {
        return
    }

    // if (await checkValidStatusDate(req, res)) {
    //     return;
    // }

    const user = await getUserByUsername(req.user.email);
    var task = {
        id: uuidv4(),
        listid: req.body.listId,
        task: req.body.task,
        summary: req.body.summary,
        duedate: req.body.dueDate,
        priority: req.body.priority,
        state: req.body.state

    };
    Tasks.create(task).then(async tdata => {
        sqlRequestDurationMicroseconds
    .labels('sql-logs')
    .observe(5);
        req.body.taskId = task.id;
        if (await checkValidStatusDate(req, res)) {
            return;
        }

        await client.index({
            index: 'task',
            document: {
                id: task.id,
                listid: task.listId,
                task: task.task,
                summary: task.summary,
                duedate: task.dueDate,
                priority: task.priority,
                state: task.state

            }
        })
        logger.info("/task created");
        res.status(201).send(
            tdata);
    }).catch(err => {
        // logger.error(" Error while creating the user! 500");
        logger.error('task create error');
        res.status(500).send({
            message: err.message || "Some error occurred while creating the list!"
        });
    });
}

async function updateTask(req, res, next) {
    console.log('update task')
    const user = await getUserByUsername(req.user.email);

    if (await checkValidity(req, res, 'taskId')) {
        return;
    }
    const lists = await Tasks.findAll({
        where: {
            id: req.body.taskId
        }
    });
    // console.log('xxxxxxxxxxxxxxx list ',JSON.stringify( lists[0].listid) )
    if (lists == '') {
        logger.error('task create error: Invalid taskId');
        res.status(400).send({
            message: 'Invalid taskId for this user'
        });
        return;
    }
    req.body.listId = lists[0].listid || ''
    if (await checkListIdBelongToUser(req, res)) {
        return
    }
    if (await checkValidStatus(req, res)) {
        return;
    }

    if (await checkValidStatusDate(req, res)) {
        return;
    }
    console.log('after checkValidStatusDate')
    console.log(req.body.priority)
    Tasks.update({
        task: req.body.task,
        summary: req.body.summary,
        duedate: req.body.dueDate,
        priority: req.body.priority
    }, {
        where: {
            id: req.body.taskId
        }
    }).then((result) => {



        if (result == 1) {
            queueMessage({
                id: req.body.taskId,
                task: req.body.task,
                summary: req.body.summary,
                duedate: req.body.dueDate,
                priority: req.body.priority
            });
            logger.info("/task updated");

            res.sendStatus(204);
        } else {
            logger.error('task create error: Invalid listId');
            res.status(400).send({
                message: 'Invalid listId'
            });
        }
    }).catch(err => {
        console.log(err);
        res.status(500).send({
            message: 'Error Updating the List try passing listId in body'
        });
    });
}

async function deleteTaskByTaskId(req, res, next) {
    console.log('task deleted')

    if (await checkValidity(req, res, 'taskId')) {
        return;
    }
    const lists = await Tasks.findAll({
        where: {
            id: req.body.taskId
        }
    });
    // console.log('xxxxxxxxxxxxxxx list ',JSON.stringify( lists[0].listid) )
    if (lists == '') {
        res.status(400).send({
            message: 'Invalid taskId for this user'
        });
        return;
    }
    req.body.listId = lists[0].listid || ''
    if (await checkListIdBelongToUser(req, res)) {
        return
    }
    const deletedcomment = await Comments.destroy({
        where: {
            taskid: req.body.taskId
        }
    })
    const deleteTaskTags = await Tasktags.destroy({
        where: {
            taskid: req.body.taskId
        }
    })
    const deletedreminder = await Reminder.destroy({
        where: {
            taskid: req.body.taskId
        }
    })
    const deletedTask = await Tasks.destroy({
        where: {
            id: req.body.taskId
        }
    })

    res.status(204).send({
        deletedTask
    })

}

async function getTaskByTaskID(req, res, next) {
    console.log('get task by id')

    if (await checkValidity(req, res, 'taskId')) {
        return;
    }

    const lists = await Tasks.findAll({
        where: {
            id: req.body.taskId
        }
    });
    // console.log('xxxxxxxxxxxxxxx list ',JSON.stringify( lists[0].listid) )
    if (lists == '') {
        res.status(400).send({
            message: 'Invalid taskId for this user'
        });
        return;
    }
    req.body.listId = lists[0].listid || ''
    if (await checkListIdBelongToUser(req, res)) {
        return
    }
    // const lists = await Tasks.findAll({where: { listid: req.body.listId }});  //getTaskByListID( req.body.listId);
    res.status(200).send(lists)
}

async function moveTask(req, res, next) {
    console.log('move task')
    if (await checkValidity(req, res, 'listId')) {
        return;
    }
    if (await checkValidity(req, res, 'taskId')) {
        return;
    }

    if (await checkListIdBelongToUser(req, res)) {
        return
    }



    const task = await Tasks.update({
        listid: req.body.listId
    }, {
        where: {
            id: req.body.taskId
        }
    }).then(async data => {
        res.status(200).send(data);
    }).catch(err => {
        // logger.error(" Error while creating the user! 500");
        res.status(500).send({
            message: err.message || "Some error occurred while creating the tasktag!"
        });
    });

}

async function getTaskByListID(req, res, next) {
    console.log('get task by list id')

    if (await checkValidity(req, res, 'listId')) {
        return;
    }
    if (await checkListIdBelongToUser(req, res)) {
        return
    }
    const lists = await Tasks.findAll({
        where: {
            listid: req.body.listId
        }
    }); //getTaskByListID( req.body.listId);

    var list1;
    let bar = new Promise((resolve, reject) => {
        lists.forEach(async (item, index, array) => {
            req.body.dueDate = await item.duedate;
            req.body.taskId = await item.id;
            req.body.state = await item.state;
            if (await checkValidStatusDate(req, res)) {
                return;
            }
            list1 = await Tasks.findAll({
                where: {
                    listid: req.body.listId
                }
            });
            if (index === array.length - 1) resolve()
        })

    });

    bar.then(() => {
        console.log("ssss")
        res.status(200).send(list1)

    });

    // await updateDueDate(req, res, lists);


}

async function updateDueDate(req, res, lists) {
    for (var list in lists) {
        console.log("xxxxxxxxxxxxxxxxxx ", lists[list].id)
        req.body.dueDate = lists[list].duedate;
        req.body.taskId = lists[list].id;
        req.body.state = lists[list].state;
        if (await checkValidStatusDate(req, res)) {
            return;
        }
    }
}

async function getUserByUsername(email) {
    return User.findOne({
        where: {
            email: email
        }
    });
}

async function getListByUsernameAndID(email, id) {
    const user = await getUserByUsername(email);
    return Lists.findAll({
        where: {
            userid: user.id,
            id: id
        }
    })
}

const getSearchData = async (req, res) => {
    console.log('get search data')
    try {
        // express validator to check if errors
        // await client.indices.refresh({ index: 'task' })
        const keywords = req.query.keywords.split(',')
        console.log(keywords)
        const resultData = []
        let searchData = new Promise((resolve, reject) => {
            keywords.forEach(async (item, index, array) => {
                let result = await client.search({
                    index: 'task',
                    query: {
                        multi_match: {
                            query: item,
                            fields: ['task', 'summary']
                        }
                    }
                })
                resultData.push(result)
                if (index === array.length - 1) resolve()
            })
        })

        searchData.then(() => {
            console.log("Reached to success")
            console.log(resultData)
            res.status(200).send(resultData)
        });
    } catch (e) {
        // setErrorResponse(e.message, res)
        console.log("e", e.message);
        res.status(400).send(e.message)
        
    }
}

module.exports = {
    createTask: createTask,
    updateTask: updateTask,
    getTaskByTaskID: getTaskByTaskID,
    getTaskByListID: getTaskByListID,
    deleteTaskByTaskId: deleteTaskByTaskId,
    moveTask: moveTask,
    getSearchData: getSearchData
};