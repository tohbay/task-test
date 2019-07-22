module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Articles', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      body: {
        type: Sequelize.TEXT
      },
      image: {
        type: Sequelize.STRING
      },
      publishedDate: {
        type: Sequelize.DATE
      },
      status: {
        type: Sequelize.ENUM('active', 'deactivated'),
        defaultValue: 'active'
      },
      authorId: {
        type: Sequelize.INTEGER
      },
      slug: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.STRING
      },
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: new Date(),
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        defaultValue: new Date(),
        allowNull: false
      }
    });
  },
  down: (queryInterface /* , Sequelize */) => {
    return queryInterface.dropTable('Articles');
  }
};
