// 패키지 require 처리에 유의!
const jwt = require('jsonwebtoken');
const RateLimit = require('express-rate-limit');

// custom middleware
exports.isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) { // isAuthenticated : 로그인 여부를 알려준다.
    next();
  } else {
    res.status(403).send('로그인 필요');
  }
  };
  
exports.isNotLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
      next();
  } else {
      res.redirect('/');
  }
};

exports.verifyToken = (req,res,next)=>{
  try {
    // headers.authorization에 있는 jwt token을 .env에 있는 JWT_SECRET과의 비교(verify)를 통해 검증
    req.decoded = jwt.verify(req.headers.authorization, process.env.JWT_SECRET);
    return next();
  } catch( error ) {
    // 토큰 Verify 과정에서 발생한 Error들의 Error코드를 임의로 지정할 수 있다. (ex : 419, 401)
    if (error.name === 'TokenExpiredError') {
      return res.status(419).json({
        code:419,
        message:'Token Expired'
      })
    }
    return res.status(401).json({
      code: 401,
      message: 'Token Invalid'
    })
  }
}

// express-rate-limit package 사용
exports.apiLimiter = RateLimit({
  windowMs: 10*1000, // 60초에 Max번 요청 가능하도록 설정
  max:1,
  delayMs:0, // request간의 Term을 설정하려면 delayMs option
  handler(req,res) {
    res.status(this.statusCode).json({
      code:this.statusCode, //429
      message:'1 request per minute available for Free Users'
    })
  }
})

exports.premiumapiLimiter = RateLimit({
  windowMs: 10*1000, // 60초에 10000(Max)번 요청 가능하도록 설정
  max:10000,
  delayMs:0, // request간의 Term을 설정하려면 delayMs option
  handler(req,res) {
    res.status(this.statusCode).json({
      code:this.statusCode, //429
      message:'10000 request per minute available for Premium Users'
    })
  }
})


// v1(version1)에서 -> v2로 버젼이 변경됐을 경우 대응하기 위해 deprecated 사용
exports.deprecated = (req,res)=>{
  res.status(410).json({
    code:410,
    message:'New Version Available. This Version is Deprecated'
  })
}