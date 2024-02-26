const db = require('../config/sequelizeDB.js');
const User = db.users;
const Lists = db.lists;
const Tasks = db.tasks;
const Comments = db.comments;
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
    if(taskid  == ''){
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

async function createComment(req, res, next) {
    if (await checkValidity(req, res, 'taskId') && await checkListIdBelongToUser(req, res) && await checkValidity(req, res, 'task')) {
        return;
    }
    if (await checkTaskIdBelongToUser(req, res)) {
        return
    }
    var comment = {
        id: uuidv4(),
        taskid: req.body.taskId,
        comment: req.body.comment
    }
    Comments.create(comment).then(async tdata => {
        res.status(200).send(
            tdata);
    }).catch(err => {
        // logger.error(" Error while creating the user! 500");
        res.status(500).send({
            message: err.message || "Some error occurred while creating the list!"
        });
    });
    
}

async function getCommentByCommentID(req, res, next) {
    
    
    if (await checkValidity(req, res, 'commentId') ) {
        return;
    }
    var comment = await Comments.findAll({
        where:{
            id: req.body.commentId
        }
    });
    req.body.taskId = comment[0].taskid;
    if (await checkTaskIdBelongToUser(req, res)) {
        return
    }   
   
    res.status(200).send(comment)
}

async function getCommentByTaskID(req, res, next) {
    
    if (await checkValidity(req, res, 'taskId') ) {
        return;
    }
    
    if (await checkTaskIdBelongToUser(req, res)) {
        return
    }  
    var comment = await Comments.findAll({
        where:{
            taskid: req.body.taskId
        }
    }); 
   
    res.status(200).send(comment)
}

async function getUserByUsername(email) {
    return User.findOne({
        where: {
            email: email
        }
    });
}

module.exports = {
    createComment: createComment,
    getCommentByCommentID:getCommentByCommentID,
    getCommentByTaskID: getCommentByTaskID
};