module.exports = (sequelize, Sequelize) => {
    const lists = sequelize.define("lists", {
        id: {
            type: Sequelize.STRING,
            primaryKey: true
        },
        userid: {
            type: Sequelize.STRING,
        },
        name: {
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
    return lists;
};