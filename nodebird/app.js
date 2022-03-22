const express = require('express');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');

require('dotenv').config() // .env 내용을 process.env.KEYNAME 으로 불러올 수 있다. -> 소스코드 노출 시 보안을 위해 .env 파일은 배포 금지

const indexRouter = require('./routes/page');
const authRouter = require('./routes/auth');
const userRouter = require('./routes/user');
const postRouter = require('./routes/post');
const { sequelize } = require('./models');
const passportConfig = require('./passport');

const app = express();
sequelize.sync(); // sequelize DB를 동기화
passportConfig(passport); // passport 활성화

app.set('view engine','pug');
// views 폴더 참고 set
app.set('views',path.join(__dirname,'views'))
app.set('port',process.env.PORT || 8001); // app.set 한것은 app.get으로 가져올 수 있음

app.use(morgan('dev'));
// express.static 정적파일 serving 용
app.use('/',express.static(path.join(__dirname,'public'))) // /main.css

// Img 정적파일 serving용 express.static 
// /img(접근주소)로 들어오는 req -> serve할 때 폴더명 : uploads(실제주소) 참고하는 매커니즘
app.use('/img',express.static(path.join(__dirname,'uploads'))) // /img/abc.png -> 로 접근
app.use(express.json())
// req.body 생성
app.use(express.urlencoded({ extended:false}))
app.use(cookieParser(process.env.COOKIE_SECRET))
app.use(session({
    resave:false,
    saveUninitialized:false,
    secret: process.env.COOKIE_SECRET,
    cookie:{
        httpOnly:true,
        secure:false,
    }
}))

app.use(flash());
// passport 두개의 middleware 
app.use(passport.initialize()); // 사용자 초기화
app.use(passport.session()); // 사용자 정보를 session에 저장하는 middleware -> app.use(session) 보다 아래에 있어야 함...


app.use('/',indexRouter);
app.use('/user',userRouter);
app.use('/auth',authRouter);
app.use('/post',postRouter);


app.use((req,res,next)=>{
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// Error Handling Middleware
app.use((err,req,res)=>{
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err: {};
    res.status(err.status || 500);
    res.render('error');
});

app.listen(app.get('port'),()=>{

    console.log(`${app.get('port')}번 포트에서 서버 실행 중 입니다`);
})