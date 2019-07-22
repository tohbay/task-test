module.exports = (sequelize, DataTypes) => {
  const Follower = sequelize.define(
    'Follower',
    {
      followerId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Users',
          key: 'id'
        }
      },

      followeeId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Users',
          key: 'id'
        }
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
    {}
  );
  Follower.associate = models => {
    Follower.belongsTo(models.User, {
      foreignKey: 'followerId',
      as: 'follower'
    });
  };
  Follower.associate = models => {
    Follower.belongsTo(models.User, {
      foreignKey: 'followeeId',
      as: 'followee'
    });
  };
  return Follower;
};
