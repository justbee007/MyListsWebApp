const express = require('express');
const router = require('./routes/router.js');
const bodyParser = require('body-parser');
const db = require("./config/sequelizeDB.js");
const env = process.env;
const fs = require('fs');

const app = express();
app.use(express.json());
app.use("/", router);

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, x-access-token"
    );
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
    res.header("Access-Control-Request-Headers", "x-access-token");
    next();
});

// db.sequelize.sync();
db.sequelize.authenticate()
    .then(() => console.log('Database Connected...'))
    .catch(err => console.log('Error:' + err))

// const port = process.env.PORT || 8080;
const port = 3030;


module.exports = app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});;

console.log(env.DB_HOST)
console.log(env.DB_USER)
console.log(env.DB_PASSWORD)
console.log(env.DB_NAME)

module.exports = app;