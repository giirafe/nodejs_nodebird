module.exports = (sequelize, DataTypes) => (
    sequelize.define('post', {
      content: {
        type: DataTypes.STRING(140),
        allowNull: false,
      },
      img: { //이미지를 서버에 저장하고 그 주소를 DB에 저장하여 불러오는 형식의 매커니즘
        type: DataTypes.STRING(200),
        allowNull: true,
      },
    }, {
      timestamps: true,
      paranoid: true,
    })
  );