const Sequelize = require('sequelize');
const env = process.env.NODE_ENV || 'development';
const config = require('../config/config')[env];
const db = {};

const sequelize = new Sequelize(
  config.database, config.username, config.password, config,
);

// sequelize 생성자 정보를 db.을 이용하여 저장해준다.
db.sequelize = sequelize;
db.Sequelize = Sequelize;

db.User = require('./user')(sequelize, Sequelize);
db.Post = require('./post')(sequelize, Sequelize);
db.Hashtag = require('./hashtag')(sequelize, Sequelize);

// 사용자(User) : 일 대 다 : 게시물(Post) 
db.User.hasMany(db.Post);
db.Post.belongsTo(db.User);
// belongsTo와 belongToMany는 다르게 쓰임~
db.Post.belongsToMany(db.Hashtag,{through:'PostHashtag'});
db.Hashtag.belongsToMany(db.Post,{through:'PostHashtag'});

// 다대다 관계에서는 새로운 모델(테이블)

// 안녕하세요 #노드 #익스프레스
// 안녕하세요 #노드 #제이드
// 안녕하세요 #제이드 #퍼그

// 1-1
// 1-2
// 2-1
// 2-3
// 3-3
// 3-4

// 1 노드
// 2 익스프레스
// 3 제이드
// 4 퍼그

// 팔로우 팔로잉 관계
db.User.belongsToMany(db.User,{
  foreignKey:'followingId',as:'Followers',through:'Follow'}); // foreignKey로 참조 설정
db.User.belongsToMany(db.User,{
  foreignKey:'followerId',as:'Followings',through:'Follow'});
// 게시물과 게시물에 'Like'하는 User들의 다대다 관계 설정
db.User.belongsToMany(db.Post,{through:'Like'})
db.Post.belongsToMany(db.User,{through:'Like', as:'Liker'});

module.exports = db;