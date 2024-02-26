const db = require('../config/sequelizeDB.js');
const User = db.users;
const bcrypt = require('bcrypt');
const {v4:uuidv4} = require('uuid');
const { createList} = require('./listsController');
const logger = require('../config/logger');
const { sqlRequestDurationMicroseconds } = require('../routes/router');
// Create a User
async function createUser (req, res, next) {
    
    console.log('create user')
    
    var hash = await bcrypt.hash(req.body.password, 10);
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!emailRegex.test(req.body.email)) {
        // logger.info("/create user 400");
        logger.error('Enter your Email ID in correct format. Example: abc@xyz.com')
        console.warn('Enter your Email ID in correct format. Example: abc@xyz.com')
        res.status(400).send({
            message: 'Enter your Email ID in correct format. Example: abc@xyz.com'
        });
    }
    const getUser = await User.findOne({
        where: {
            email: req.body.email
        }
    }).catch(err => {
        // logger.error("/create user error 500");
        console.error('Some error occurred while creating the user')
        res.status(500).send({
            message: err.message || 'Some error occurred while creating the user'
        });
    });

    console.log('verified and existing 1');

   
    if (getUser) {
        console.log('verified and existing', getUser.dataValues.isVerified);
        var msg = getUser.dataValues.isVerified ? 'User already exists! & verified' : 'User already exists! & not verified';
        console.error('verified and existing msg' ,msg);
        logger.error('user exist');
        res.status(400).send({
            message: msg
        });
    } else {
        var user = {
            id: uuidv4(),
            firstname: req.body.firstname,
            lastname: req.body.lastname,
            password: hash,
            email: req.body.email,
            is_verified: true
        };
        console.log('above user');
        sqlRequestDurationMicroseconds
        .labels('sql-logs')
        .observe(5);
        User.create(user).then(async udata => {

                const randomnanoID = uuidv4();

                const expiryTime = new Date().getTime();
                req.body.listname = 'default list'
                req.user = {
                    email: req.body.email,
                    password: req.body.email
                }
                logger.info("/user created");
                createList(req, res , next);
                return
            })
            .catch(err => {
                // logger.error(" Error while creating the user! 500");
                logger.error('user create error');
                res.status(500).send({
                    message: err.message || "Some error occurred while creating the user!"
                });
            });
    }
}

//Get a User
async function getUser(req, res, next) {
    console.log('get user')
    const user = await getUserByUsername(req.user.email);
    if (user) {
        logger.info("/user get");
        res.status(200).send({
            id: user.dataValues.id,
            firstname: user.dataValues.firstname,
            lastname: user.dataValues.lastname,
            email: user.dataValues.email,
            account_created: user.dataValues.createdat,
            account_updated: user.dataValues.updatedat
        });
    } else {
        logger.error('user not exist');
        res.status(400).send({
            message: 'User not found!'
        });
    }
}

// Update a user

async function updateUser(req, res, next) {
    // if(req.body.email != req.user.email) {
    //     res.status(400);
    // }
    console.log('update user')
    if(!req.body.firstname || !req.body.lastname || !req.body.email || !req.body.password) {
        console.warn('Enter all parameters!');
        res.status(400).send({
            message: 'Enter all parameters!'
        });
    }
    // console.log('mail '+req.body.email)
    sqlRequestDurationMicroseconds
    .labels('sql-logs')
    .observe(5);
    User.update({ 
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        password: await bcrypt.hash(req.body.password, 10),
        email: req.body.email 
    }, {where : {email: req.user.email}}).then((result) => {

        if (result == 1) {
            logger.info("/user updated successfully");
            res.sendStatus(204);
        } else {
            logger.error('user update error');
            res.sendStatus(400);
        }   
    }).catch(err => {
        console.log(err);
        logger.error('user update error',err);
        console.error('Error Updating the user, use different mail to update mail');
        res.status(400).send({
            message: 'Error Updating the user, use different mail to update mail'
        });
    });
}

async function getUserByUsername(email) {
    console.log('get user by username')
    sqlRequestDurationMicroseconds
    .labels('sql-logs')
    .observe(5);
    return User.findOne({where : {email: email}});
}

async function comparePasswords (existingPassword, currentPassword) {
    return bcrypt.compare(existingPassword, currentPassword);
}

module.exports = {
    createUser: createUser,
    getUser: getUser,
    getUserByUsername: getUserByUsername,
    comparePasswords: comparePasswords,
    updateUser: updateUser
};