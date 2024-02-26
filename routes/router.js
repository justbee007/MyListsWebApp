const router = require('express').Router();
const baseAuthentication = require('../util/auth.js');
const userController = require('../Controller/usersController.js');
const listsController = require('../Controller/listsController.js');
const taskController = require('../Controller/taskController.js');
const commentController = require('../Controller/commentController.js');
const reminderController = require('../Controller/reminderController.js');
const tagController = require('../Controller/tagController.js');

const Prometheus = require('prom-client');
const collectDefaultMetrics = Prometheus.collectDefaultMetrics;
collectDefaultMetrics({
    timeout: 5000
});

const httpRequestDurationMicroseconds = new Prometheus.Histogram({
    name: 'http_request_duration_ms',
    help: 'Duration of HTTP requests in ms',
    labelNames: ['route'],
    // buckets for response time from 0.1ms to 500ms
    buckets: [ 1, 2, 4, 8, 12]
});

const sqlRequestDurationMicroseconds = new Prometheus.Histogram({
    name: 'sql_request_duration_ms',
    help: 'Duration of sql requests in ms',
    labelNames: ['route'],
    // buckets for response time from 0.1ms to 500ms
    buckets: [ 1, 2, 4, 8, 12]
});

const counter = new Prometheus.Counter({
    name: 'node_request_operations_total',
    help: 'number of processed request',
});


// GET Method

router.get("/healthz", (req, res) => {
    console.log("Is it hitting?")
    counter.inc();
    console.log('counter')
    httpRequestDurationMicroseconds
    .labels('prom-logs')
    .observe(5);
    res.sendStatus(200).json();
    
});

//createUser POST Method

router.post("/v1/user", userController.createUser);

// getUser GET Method (With Authentication)

router.get("/v1/user/self", baseAuthentication() , userController.getUser);

// updateUser PUT Method

router.put("/v1/user/self", baseAuthentication() , userController.updateUser);

//Add List
router.post("/v1/user/list", baseAuthentication(), listsController.createList);

//update List
router.put("/v1/user/listupdate", baseAuthentication(), listsController.updateList);

//get all list 
router.get("/v1/user/getalllist", baseAuthentication(), listsController.getAllList);

//get list 
router.get("/v1/user/getlist", baseAuthentication(), listsController.getListByID);

//delete list 
router.delete("/v1/user/deletelist", baseAuthentication(), listsController.deleteList);

//Add task
router.post("/v1/user/addtask", baseAuthentication(), taskController.createTask);
// {
//     "listname":"my list 8",
//     "listId": "c8641523-79a9-4e2b-9bc0-40cf2df4aa46",
//     "task": "my task 4",
//     "summary": "this is task summary",
//     "dueDate": "2022-10-29",
//     "date":"2022-10-21 05:25:43.69",
//     "priority": "Medium",
//     "state": "TODO" 
// }

//get Task By ListID
router.get("/v1/user/gettaskbylistid", baseAuthentication(), taskController.getTaskByListID);
// {
//     "listId": "481c3540-acb6-4935-8b44-ca4e8b87c2fa"
// }

//get Task By TaskID
router.get("/v1/user/gettaskbytaskid", baseAuthentication(), taskController.getTaskByTaskID);
// {
//     "taskId": "86ce78fd-1c88-4a29-87df-9e1afcdfa562"
// }

//move task
router.put("/v1/user/movetask", baseAuthentication(), taskController.moveTask);
// {
//    "taskId": "481c3540-acb6-4935-8b44-ca4e8b87c2fa",
//   "listId": "481c3540-acb6-4935-8b44-ca4e8b87c2fa",
// }

//Delete Task By TaskID
router.delete("/v1/user/deletetaskbytaskid", baseAuthentication(), taskController.deleteTaskByTaskId);
// {
//     "taskId": "86ce78fd-1c88-4a29-87df-9e1afcdfa562"
// }

//update task
router.put("/v1/user/updatetask", baseAuthentication(), taskController.updateTask);
// {
//     "taskId": "5de19f95-adc2-40bf-84a4-1e10f97c510d",
//     "listname":"my list 8",
//     "listId": "481c3540-acb6-4935-8b44-ca4e8b87c2fa",
//     "task": "my task 69",
//     "summary": "this is task summary 2",
//     "dueDate": "2022-11-04",
//     "priority": "Low",
//     "state": "INPROGRESS" 
// }

//Add Comment by taskId
router.post("/v1/user/addcomment", baseAuthentication(), commentController.createComment);
// {
//     "taskId": "0cec731b-9b52-4947-927e-a1170a2106b7",
//     "comment":"this is a comment"
// }

//get Comment by commentId
router.get("/v1/user/getcomment", baseAuthentication(), commentController.getCommentByCommentID);
// {
//     "commentId": "6b70a792-084a-42ec-b5df-57a8bcf96dd2",
// }

//get Comment by taskId
router.get("/v1/user/getcommentbytaskid", baseAuthentication(), commentController.getCommentByTaskID);
// {
//   "taskId": "0cec731b-9b52-4947-927e-a1170a2106b7"
// }

//Add Reminder by taskId
router.post("/v1/user/addreminder", baseAuthentication(), reminderController.createReminder);
// {
//     "taskId": "0cec731b-9b52-4947-927e-a1170a2106b7",
//     "reminderDate":"2022-11-01 00:58:18.351"
// }

//get Comment by taskId
router.get("/v1/user/getreminderbytaskid", baseAuthentication(), reminderController.getReminderByTaskID);
// {
//   "taskId": "0cec731b-9b52-4947-927e-a1170a2106b7"
// }

//Add tag by taskId
router.post("/v1/user/addtag", baseAuthentication(), tagController.createTags);
// {
//     "taskId": "634aba16-3a1a-453c-a873-60284bda3622",
//     "name": "tag4"
// }

//Rename tag
router.put("/v1/user/renametag", baseAuthentication(), tagController.renameTag);
// {

//     "name": "tag4"
//      "rename": "new tag"
// }

//Get tag by taskId
router.get("/v1/user/gettag", baseAuthentication(), tagController.getTagsByTaskID);
// {
//     "taskId": "634aba16-3a1a-453c-a873-60284bda3622",

// }

router.get("/self/search", baseAuthentication(), taskController.getSearchData);

// router.get('/metrics', (req, res) => {
//     console.log('content type ------------ ', Prometheus.register.contentType)
//     res.set('Content-Type', Prometheus.register.contentType)
//     // res.end(Prometheus.register.metrics())
//     console.log('prometheus register metrics------------ ', Prometheus.register.metrics())
//     res.writeHead(200, { 'Content-Type':  Prometheus.register.contentType });
//     res.write(JSON.stringify(Prometheus.register.metrics()));
//     res.end();
//   })

router.get('/metrics', async (req, res) => {
	try {
		res.set('Content-Type', Prometheus.register.contentType);
		res.end(await Prometheus.register.metrics());
	} catch (ex) {
		res.status(500).end(ex);
	}
});

module.exports = router; 
module.exports = {
    router: router,
    sqlRequestDurationMicroseconds: sqlRequestDurationMicroseconds
};