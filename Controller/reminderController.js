const db = require('../config/sequelizeDB.js');
const User = db.users;
const Lists = db.lists;
const Tasks = db.tasks;
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
    console.log('check getListByUsernameAndTaskID ' )
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
    console.log('check checkTaskIdBelongToUser ' )
    const lists = await getListByUsernameAndTaskID(req.user.email, req.body.taskId)

    if (lists == '') {
        res.status(400).send({
            message: 'Invalid listId for this user'
        });
        return true
    }
}

async function createReminder(req, res, next) {
    console.log('xxxxxxxxxxxxxxxx createReminder')
    if (await checkValidity(req, res, 'taskId') && await checkListIdBelongToUser(req, res) && await checkValidity(req, res, 'task')) {
        return;
    }
    if (await checkTaskIdBelongToUser(req, res)) {
        return
    }
    const tasks = await Reminder.findAll({
        where: {
            taskid: req.body.taskId
        }
    });
   
    console.log('xxxxxxxxxxxxxxxx createReminder', tasks.length)

    if( tasks.length >= 5){
        res.status(400).send({
            message: "Cant create more than 5 reminders"
        });
        return
    }
    var reminder = {
        id: uuidv4(),
        taskid: req.body.taskId,
        reminderdate: req.body.reminderDate
    }
    Reminder.create(reminder).then(async tdata => {
        res.status(200).send(
            tdata);
    }).catch(err => {
        // logger.error(" Error while creating the user! 500");
        res.status(500).send({
            message: err.message || "Some error occurred while creating the list!"
        });
    });
    
}

async function getReminderByTaskID(req, res, next) {
    
    if (await checkValidity(req, res, 'taskId') ) {
        return;
    }
    
    if (await checkTaskIdBelongToUser(req, res)) {
        return
    }  
    var comment = await Reminder.findAll({
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
    createReminder: createReminder,
    getReminderByTaskID: getReminderByTaskID
};