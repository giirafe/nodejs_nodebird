const local = require('./localStrategy');
const kakao = require('./kakaoStrategy');
const { User } = require('../models');

// Caching 위한 dictionary 생성
// const user = {};

module.exports = (passport) => {

    passport.serializeUser((user,done)=>{ // req.login을 통해 session에 저장된 { id:1, name:zero, age:25 } -> 위 정보를 모두 session에 저장하기에는 너무 무겁다... 
        done(null,user.id); // 그렇기에 user.id만 session에 저장(고유성을 보장한다는 가정하..)
    });

    // deserializeUser는 메모리에 저장된 'user.id'를 DB에서 찾아 완전한 id, name, age의 user정보를 복구시켜준다.
    // deserializeUser는 모든 요청에 따라 실행되기에 DB 조회를 캐싱해서 효율적이게 생성해야 한다
    // 여기서 Caching(캐싱)은 좀 더 빠른 메모리 영역으로 데이터를 가져와서 접근하는 방식을 말한다. -> 아래의 if else문과 위의 user 변수 생성을 통해 캐싱 시행
    // passport.deserializeUser((id,done)=>{
    //     if (user[id]){
    //         done(user[id]);
    //     } else {
    //         // User.find를 통해 DB 조회 => req.user에 저장
    //         User.findOne({ where: {id} }).then(user => user[id] = user, done(null,user)).catch(err=>done(err));
    //     }
    // })

    
    // passport.deserializeUser((id,done)=>{
    //     User.findOne({where: { id } }).then(user => done(null,user)).catch(err=>done(err));
    // })

    // github 참조 Try -> 성공 
    // 21/02/13 res.rendering시 Followings의 목록 rendering 하는 과정에서 지속적으로 에러 발생 아마 강의 내용이 업데이트되지 않아서 그런듯... -> Github을 참고해 코드 수정 이후 문제없이 진행
    passport.deserializeUser((id, done) => {
        User.findOne({
          where: { id },
          // user의 팔로잉/팔로워 관계를 include해준다...(가져오기)
          include: [{
            model: User,
            attributes: ['id', 'nick'],
            as: 'Followers',
          }, {
            model: User,
            attributes: ['id', 'nick'],
            as: 'Followings',
          }],
        })
          .then(user => done(null, user))
          .catch(err => done(err));
      });

    local(passport); // 로컬 로그인 시
    // kakao(passport); // 카카오 통한 로그인 시
}