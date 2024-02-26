const db = require('../config/sequelizeDB.js');
const User = db.users;
const Lists = db.lists;
const Tasks = db.tasks;
const Comments = db.comments;
const Tags = db.tags;
const Tasktags = db.tasktags;
const {
    v4: uuidv4
} = require('uuid');


async function checkValidity(req, res, field) {
    console.log('check valid ' + field)
    if (!req.body[field]) {
        return res.status(400).send({
            message: 'Error Updating the List try passing ' + field + ' in body'
        });
        return true;
    }
}

async function getListByUsernameAndTaskID(email, id) {
    const user = await getUserByUsername(email);
    const taskid = await Tasks.findAll({
        where: {
            id: id
        }
    });
    if (taskid == '') {
        return ''
    }
    return Lists.findAll({
        where: {
            userid: user.id,
            id: taskid[0].listid
        }
    })
}

async function checkTaskIdBelongToUser(req, res) {
    const lists = await getListByUsernameAndTaskID(req.user.email, req.body.taskId)

    if (lists == '') {
        res.status(400).send({
            message: 'Invalid listId for this user'
        });
        return true
    }
}

async function createTags(req, res, next) {
    if (await checkValidity(req, res, 'taskId') && await checkListIdBelongToUser(req, res) && await checkValidity(req, res, 'task')) {
        return;
    }
    if (await checkTaskIdBelongToUser(req, res)) {
        return
    }
    const user = await getUserByUsername(req.user.email)

    const tasktag = await Tasktags.findAll({
        where: {
            taskid: req.body.taskId
        }
    })

    //CHECK IT TASK ALREADY HAVE 10 TAGS
    if (tasktag.length >= 10) {
        res.status(400).send({
            message: "Already have 10 tags!"
        });
        return
    }
    
    var tagsData;
    var tags;
    const tag = await Tags.findAll({
        where: {
            userid: user.id,
            name: req.body.name
        }
    })

    if (tag == '') {
        //FOR CREATING NEW TAG
        // console.log('xxxxxxxxxxxxxxxxx notags ', )
        const id = uuidv4();
        tags = {
            id: id,
            userid: user.id,
            name: req.body.name
        }
        await Tags.create(tags).then(async tagsData => {

            tagsData = tagsData;

        }).catch(err => {
            // logger.error(" Error while creating the user! 500");
            res.status(500).send({
                message: err.message || "Some error occurred while creating the tag!"
            });
            return;
        });

        //FOR ASSIGNING THE NEW TAG TO TASK
        var taskTag = {
            taskid: req.body.taskId,
            tagid: id
        }

        Tasktags.create(taskTag).then(async taskTagData => {
            res.status(200).send({
                tagsData,
                taskTagData
            });
        }).catch(err => {
            // logger.error(" Error while creating the user! 500");
            res.status(500).send({
                message: err.message || "Some error occurred while creating the tasktag!"
            });
        });
    } else {
        //FOR USING EXISTING TAG

        //TO CHECK IF THE TASK ALREADY CONTAIN TAG
        const tasktag = await Tasktags.findAll({
            where: {
                taskid: req.body.taskId,
                tagid: tag[0].id
            }
        })

        if (tasktag != '') {
            res.status(400).send({
                message: "Already have this tag!!"
            });
            return
        }

        //TASK DOES NOT CONTAIN THIS TAG SO BELOW WE CREATE IT
        var taskTag = {
            taskid: req.body.taskId,
            tagid: tag[0].id
        }

        Tasktags.create(taskTag).then(async taskTagData => {
            res.status(200).send({
                tagsData,
                taskTagData
            });
        }).catch(err => {
            // logger.error(" Error while creating the user! 500");
            res.status(500).send({
                message: err.message || "Some error occurred while creating the tasktag!"
            });
        });
    }

}

async function renameTag(req, res, next) {
    if (await checkValidity(req, res, 'name')) {
        return;
    }
    if (await checkValidity(req, res, 'rename')) {
        return;
    }

    const user = await getUserByUsername(req.user.email)
    const tag = await Tags.findAll({
        where: {
            userid: user.id,
            name: req.body.rename
        }
    })

    if (tag == '') {

        const tag = await Tags.update({
            name: req.body.rename
        }, {
            where: {
                userid: user.id,
                name: req.body.name
            }
        }).then(async data => {
            res.status(200).send(data);
        }).catch(err => {
            // logger.error(" Error while creating the user! 500");
            res.status(500).send({
                message: err.message || "Some error occurred while creating the tasktag!"
            });
        });
    }else{
        res.status(400).send({
            message: "Tag name already exist!"
        });
    }
}



async function getTagsByTaskID(req, res, next) {

    if (await checkValidity(req, res, 'taskId')) {
        return;
    }

    if (await checkTaskIdBelongToUser(req, res)) {
        return
    }

    const tasktag = await Tasktags.findAll({
        where: {
            taskid: req.body.taskId
        }
    }).then(async data => {
        var tags =[];
        for( var d in data){
            const tagData = await Tags.findAll({
                where: {
                    id: data[d].tagid
                }
            })
            tags.push(tagData);
        }
        res.status(200).send(tags);
    }).catch(err => {
        // logger.error(" Error while creating the user! 500");
        res.status(500).send({
            message: err.message || "Some error occurred while creating the tasktag!"
        });
    });

}

async function getUserByUsername(email) {
    return User.findOne({
        where: {
            email: email
        }
    });
}

module.exports = {
    createTags: createTags,
    renameTag: renameTag,
    getTagsByTaskID: getTagsByTaskID
};