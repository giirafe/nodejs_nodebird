const express = require('express')
const uuidv4 = require('uuid/v4');
const { User, Domain } = require('../models')
const router = express.Router();

router.get('/', (req,res,next)=>{
    User.findOne({
        // 처음 접근한 사용자를 위해 id || null 조건 삽입
        where:{id:req.user && req.user.id || null },
        include: { model : Domain },
    }).then((user)=>{
        res.render('login',{
            user,
            loginError: req.flash('loginError'),
            domains: user && user.domains,
        })
    })
    .catch((error)=>{
        console.error(error);
        next(error);
    })
})

router.post('/domain', (req, res, next) => {
    Domain.create({
      userId: req.user.id,
      host: req.body.host,
      type: req.body.type,
      // cleintSecret에는 API 사용자들을 위한 비밀키 발급
      // uuidv4() 패키지를 이용해 각 사용자마다 고유한 ID를 발급 
      // Domain 주소는 프론트 요청 시, ClientSecret는 서버 요청 시 검사
      // 클라이언트 비밀키 = ClientSecret
      clientSecret: uuidv4(),
      frontSecret: uuidv4()
    })
      .then(() => {
        res.redirect('/');
      })
      .catch((error) => {
        next(error);
      });
  });
  

module.exports = router;