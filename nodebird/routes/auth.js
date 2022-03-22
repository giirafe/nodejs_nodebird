const express = require('express');
const bcrypt = require('bcrypt');
const passport= require('passport');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
const { User } = require('../models');

const router = express.Router();

// POST /auth/join
// LoggedIn된 사용자는 Join할 필요가 없기에 isNotLoggedIn middleware를 사용해준다.
router.post('/join',isNotLoggedIn, async (req,res,next)=>{
    const { email, nick, password } = req.body;
    try {
        const exUser = await User.findOne({ where : { email }})
        // 만약 User가 이미 존재한다면 회원가입(join)페이지로 redirect 해준다.
        if (exUser){
            req.flash('joinError','User Already Registered')
            return res.redirect('/join');
        }
        // PW bcrypt 해쉬 암호화 -> option의 숫자는 올라갈수록 시간이 오래 걸리지만 보안성은 increase
        const hash = await bcrypt.hash(password, 12);
        await User.create({
            email,
            nick,
            password: hash,
        })
        return res.redirect('/');
        
    } catch (error) {
        console.error(error);
        next(error);
    }
});

router.post('/login',isNotLoggedIn,(req,res,next)=>{ // req.body.email, req.body.password

    // localStrategy.js 속 done(Error,Success,Fail) => authError,user,info로 전달되는 것
    passport.authenticate('local',(authError,user,info)=>{
        if (authError) {
            console.error(authError);
            return next(authError);
        }
        if (!user) { // user 정보가 없으면 Failure이기에
            req.flash('loginError', info.message);
            return res.redirect('/');
        }

        return req.login(user,(loginError) => { // req.user에서 사용자의 정보를 찾을 수 있게된다(session에 저장)
            if (loginError){ // 최악의 경우 user 정보가 전달되어도 login에 실패할 수 있기에 이 경우를 handle
                console.error(loginError);
                return next(loginError);
            }
            return res.redirect('/');
        })
    })(req,res,next);
});

router.get('/logout',isLoggedIn,(req,res)=>{
    req.logout();
    req.session.destroy(); // req.user의 세션 정보를 삭제
    res.redirect('/');
});

module.exports = router;