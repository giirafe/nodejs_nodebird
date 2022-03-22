const express = require('express');
const path = require('path');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('connect-flash');
// color-hash 라이브러리 업데이트로 -> .default 추가해야 정상작동
const ColorHash = require('color-hash').default;
require('dotenv').config();

const webSocket = require('./socket');
const indexRouter = require('./routes');
const connect = require('./schemas/index')

const app = express();
connect()

const sessionMiddleware = session({
    resave: false,
    saveUninitialized: false,
    secret: process.env.COOKIE_SECRET,
    cookie: {
      httpOnly: true,
      secure: false,
    },
  })

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.set('port', process.env.PORT || 8005);

app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/gif', express.static(path.join(__dirname,'uploads')))
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// connect.sid를 Decrypt하는 cookieParser
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(sessionMiddleware);
app.use(flash());

app.use((req,res,next)=>{
    // 새로 들어오는 사용자마다 각자의 고유 id => sessionID로 고유의 색을 지정해준다.
    if (!req.session.color){
        const colorHash = new ColorHash();
        req.session.color = colorHash.hex(req.sessionID);
    }
    next()
})

app.use('/', indexRouter);

app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

const server = app.listen(app.get('port'), () => {
  console.log(app.get('port'), '번 포트에서 대기중');
});

// 위에서 server 변수에 할당한 express server를 앞에서 webSocket으로 require한(socket.js)를 이용하여 server를 webSocket에 연결해준다.
webSocket(server,app, sessionMiddleware);