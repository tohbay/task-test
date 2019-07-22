import bcrypt from 'bcrypt';

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
    {
      username: DataTypes.STRING,
      email: {
        type: DataTypes.STRING,
        unique: true
      },
      avatar: DataTypes.STRING,
      bio: DataTypes.STRING,
      password: DataTypes.STRING,
      resetPasswordToken: DataTypes.STRING,
      expirationTime: DataTypes.DATE,
      role: {
        type: DataTypes.ENUM,
        values: ['user', 'admin', 'superadmin']
      },
      status: {
        type: DataTypes.ENUM,
        values: ['unverified', 'active', 'inactive']
      },
      createdAt: {
        allowNull: false,
        defaultValue: new Date(),
        type: DataTypes.DATE
      },
      updatedAt: {
        allowNull: false,
        defaultValue: new Date(),
        type: DataTypes.DATE
      }
    },
    {
      hooks: {
        beforeCreate: async user => {
          user.password = await bcrypt.hash(
            user.password,
            await bcrypt.genSalt(15)
          );
        }
      }
    }
  );
  User.associate = models => {
    User.belongsToMany(models.User, {
      through: 'Followers',
      as: 'follower',
      foreignKey: 'followerId'
    });
  };
  User.associate = models => {
    User.belongsToMany(models.User, {
      through: 'Followers',
      as: 'followee',
      foreignKey: 'followeeId'
    });

    User.hasMany(models.Rating, {
      foreignKey: 'userId',
      as: 'rating'
    });
  };
  User.associate = models => {
    User.belongsToMany(models.Article, {
      through: 'Bookmarks',
      foreignKey: 'userId',
      as: 'articleId'
    });
  };
  return User;
};
