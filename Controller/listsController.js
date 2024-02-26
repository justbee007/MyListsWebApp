const db = require('../config/sequelizeDB.js');
const User = db.users;
const Lists = db.lists;
const Tasks = db.tasks;
const Comments = db.comments;
const Reminder = db.reminders;
const Tasktags = db.tasktags;
const logger = require('../config/logger');
const {
    v4: uuidv4
} = require('uuid');
const { sqlRequestDurationMicroseconds } = require('../routes/router');

async function checkValidity(req, res, field) {
    console.log('check valid ' + field)
    if (!req.body[field]) {
        return res.status(400).send({
            message: 'Error Updating the List try passing ' + field + ' in body'
        });
        return true;
    }
}

async function checkListIdBelongToUser(req, res) {
    const lists = await getListByUsernameAndID(req.user.email, req.body.listId)

    if (lists == '') {
        res.status(400).send({
            message: 'Invalid listId for this user'
        });
        return true
    }
}

async function createList(req, res, next) {
    console.log('created list')
    if (await checkValidity(req, res, 'listname')) {
        return;
    }
    const user = await getUserByUsername(req.user.email);
    var list = {
        id: uuidv4(),
        userid: user.id,
        name: req.body.listname

    };
    sqlRequestDurationMicroseconds
    .labels('sql-logs')
    .observe(5);
    Lists.create(list).then(async ldata => {
        logger.info("/list created");
        res.status(201).send({
            'user': user,
            'list': {
                id: ldata.id,
                name: ldata.name
            }
        });
    }).catch(err => {
        // logger.error(" Error while creating the user! 500");
        logger.error('list create error');
        res.status(500).send({
            message: err.message || "Some error occurred while creating the list!"
        });
    });
}

async function updateList(req, res, next) {
    console.log('update list')
    const user = await getUserByUsername(req.user.email);

    if (await checkValidity(req, res, 'listname')) {
        return;
    }
    if (await checkValidity(req, res, 'listId')) {
        return;
    }

    sqlRequestDurationMicroseconds
    .labels('sql-logs')
    .observe(5);
    Lists.update({
        name: req.body.listname
    }, {
        where: {
            id: req.body.listId
        }
    }).then((result) => {

        if (result == 1) {
            logger.info("/list uopdated");
            res.sendStatus(204);
        } else {
            logger.error('list update error: Invalid listId');
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

async function deleteList(req, res, next) {
    console.log('delete list')
    if (await checkValidity(req, res, 'listId')) {
        return;
    }

    await deleteTaskByListId(req, res, next);
    const rslt = await deleteByUsernameAndID(req.user.email, req.body.listId);
    logger.info("/list deleted");

    res.status(200).send({
        result: rslt
    })

}

async function deleteTaskByListId(req, res, next) {
    if (await checkValidity(req, res, 'listId')) {
        return;
    }
    if (await checkListIdBelongToUser(req, res)) {
        return;
    }

    const tasks = await Tasks.findAll({
        where: {
            listid: req.body.listId
        }
    })

    for (var task in tasks) {
        sqlRequestDurationMicroseconds
    .labels('sql-logs')
    .observe(5);
        const deletedcomment = await Comments.destroy({
            where: {
                taskid: tasks[task].id
            }
        })
        const deletedreminder = await Reminder.destroy({
            where:{
                taskid: tasks[task].id
            }
        })
        const deleteTaskTags = await Tasktags.destroy({
            where:{
                taskid: tasks[task].id
            }
        })
    }
    const deletedTask = Tasks.destroy({
        where: {
            listid: req.body.listId
        }
    })
    return deletedTask;

}

async function getAllList(req, res, next) {

    const lists = await getListByUsername(req.user.email);

    res.status(200).send({
        lists: lists
    })

}

async function getListByID(req, res, next) {
    console.log('get list by id')
    if (await checkValidity(req, res, 'listId')) {
        return;
    }
    const lists = await getListByUsernameAndID(req.user.email, req.body.listId);
    res.status(200).send(lists)
}

async function getListByUsername(email) {
    const user = await getUserByUsername(email);
    return Lists.findAll({
        where: {
            userid: user.id
        }
    })
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

async function deleteByUsernameAndID(email, id) {
    const user = await getUserByUsername(email);
    return Lists.destroy({
        where: {
            userid: user.id,
            id: id
        }
    })
}

async function getUserByUsername(email) {
    return User.findOne({
        where: {
            email: email
        }
    });
}

module.exports = {
    createList: createList,
    updateList: updateList,
    getAllList: getAllList,
    getListByID: getListByID,
    deleteList: deleteList,
    getListByUsernameAndID: getListByUsernameAndID
};