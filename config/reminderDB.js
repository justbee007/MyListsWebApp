module.exports = (sequelize, Sequelize) => {
    const reminders = sequelize.define("reminders", {
        id: {
            type: Sequelize.STRING,
            primaryKey: true
        },
        taskid: {
            type: Sequelize.STRING,
        },
        reminderdate: {
            type: Sequelize.DATE,
        },
        created_at: {
            type: Sequelize.DATE
        },
        updated_at: {
            type: Sequelize.DATE
        }
    }, {
        schema: 'todo',
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });
    return reminders;
};