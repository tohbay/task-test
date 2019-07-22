module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      username: {
        type: Sequelize.STRING,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING,
        unique: true
      },
      avatar: {
        type: Sequelize.STRING
      },
      bio: {
        type: Sequelize.STRING
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false
      },
      resetPasswordToken: {
        type: Sequelize.STRING
      },
      expirationTime: {
        type: Sequelize.DATE
      },
      role: {
        type: Sequelize.ENUM,
        values: ['user', 'admin', 'superadmin'],
        defaultValue: 'user'
      },
      status: {
        type: Sequelize.ENUM,
        values: ['unverified', 'active', 'inactive'],
        defaultValue: 'unverified'
      },
      createdAt: {
        allowNull: false,
        defaultValue: new Date(),
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        defaultValue: new Date(),
        type: Sequelize.DATE
      }
    });
  },
  down: (queryInterface /* , Sequelize */) => {
    return queryInterface.dropTable('Users');
  }
};
