const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');

const { User } = require('../models');

module.exports = (passport) => {
    passport.use(new LocalStrategy({
        // urlencoded middleware를 통해 추출된 req.body의 값들 email, password를 각각 usernameField, passwordField에 연결해준다.
        usernameField : 'email', // req.body.email
        passwordField : 'password', // req.body.password
    }, async (email, password,done)=>{ // done(에러, 성공, 실패) 
        try{
            const exUser = await User.findOne({where : {email}}) // 1차적으로 email 존재 여부 확인
            if (exUser){
                // 비밀번호 검사
                const result = await bcrypt.compare(password, exUser.password);
                if (result) {
                    // if Exist done(성공)
                    done(null, exUser);
                } else {
                    // else done(false)
                    done(null, false, {message:'Incorrect Password'})
                }
            } else {
                done(null, false, { message : 'User Does Not Exist'})
            }
        } catch (error) {
            console.error(error);
            done(error); // 에러 떠서 실패
        }
    }))
}