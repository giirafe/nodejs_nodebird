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