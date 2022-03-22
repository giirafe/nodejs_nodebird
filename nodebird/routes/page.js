const express = require('express');
const router = express.Router();
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
const { Post, User } = require('../models');

// 프로필 페이지
router.get('/profile',isLoggedIn, (req, res) => {
    res.render('profile', { title: '내 정보 - NodeBird', user: req.user });
  });

// 회원가입 페이지
router.get('/join', isNotLoggedIn, (req, res) => {
    res.render('join', {
        title: '회원가입 - NodeBird',
        user: req.user,
        joinError: req.flash('joinError'),
    });
});

// 메인 페이지
// router.get('/', (req, res, next) => {
//   console.log(req.user)
//   res.render('main',{
//     title: 'NodeBird',
//     twits: [],
//     user: req.user,
//     loginError: req.flash('loginError')
//   })
// }); 

router.get('/', (req, res, next) => {
  console.log('GET main page')
  Post.findAll({
    include: [{ // Post 작성자
      model: User,// User table에서
      attributes : ['id','nick'],
    }, { // Post에 좋아요 누른 사람들(Liker)
      model : User,
      attributes : ['id','nick'],
      as:'Liker' // model/index.js에서 Like 테이블의 as:'Liker'를 설정했기에 이것이 가능하다.
    }]
  }).then((posts)=>{
    res.render('main',{
      title: 'NodeBird',
      twits:posts,
      user:req.user,
      loginError: req.flash('loginError')
    })
  }).catch((error)=>{
    console.error(error);
    next(error)
  });
}); 

module.exports = router;
  