module.exports = (sequelize, Sequelize) => {
    const tasktags = sequelize.define("tasktags", {
        taskid: {
            type: Sequelize.STRING,
        },
        tagid: {
            type: Sequelize.STRING,
        }
    }, {
        schema: 'todo',
        timestamps: false,
        freezeTableName: true
    });
    tasktags.removeAttribute('id');
    return tasktags;
};