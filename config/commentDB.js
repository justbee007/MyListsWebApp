module.exports = (sequelize, Sequelize) => {
    const comments = sequelize.define("comments", {
        id: {
            type: Sequelize.STRING,
            primaryKey: true
        },
        taskid: {
            type: Sequelize.STRING,
        },
        comment: {
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
    return comments;
};