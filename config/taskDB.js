module.exports = (sequelize, Sequelize) => {
    const tasks = sequelize.define("tasks", {
        id: {
            type: Sequelize.STRING,
            primaryKey: true
        },
        listid: {
            type: Sequelize.STRING,
        },
        task: {
            type: Sequelize.STRING,
        },
        summary: {
            type: Sequelize.STRING,
        },
        duedate: {
            type: Sequelize.DATE,
        },
        priority: {
            type: Sequelize.STRING,
        },
        state: {
            type: Sequelize.STRING,
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
    return tasks;
};