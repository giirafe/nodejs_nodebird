const express =require('express');

const router = express.Router();
const { isLoggedIn } = require('./middlewares');
const { User } = require('../models');


// Following 구현 POST
router.post('/:id/follow', isLoggedIn, async (req,res,next)=>{
    try {
        // 현재 request의 user.id로 user를 찾은 후
        const user = await User.find({ where : { id: req.user.id}});
        // user의 Following 목록을 A.addB(관계 생성)
        await user.addFollowing(parseInt(req.params.id,10));
        res.send('success');
    } catch (error) {
        console.error(error);
        next(error);
    }
})

// UnFollowing 구현 POST - 수정한 main.pug에서 넘어온 /:id/unfollow POST 요청에 대응하는 Router
router.post('/:id/unfollow', isLoggedIn, async (req,res,next)=>{
    try {
        // 현재 request의 user.id로 user를 찾은 후
        const user = await User.find({ where : { id: req.user.id}});
        // user의 Following 목록을 A.addB(관계 생성)
        await user.removeFollowing(parseInt(req.params.id,10));
        res.send('success');
    } catch (error) {
        console.error(error);
        next(error);
    }
})

router.post('/profile',async (req,res,next)=>{
    try{
        await User.update({ nick : req.body.nick },{
        where: { id: req.user.id },
    });
    } catch (err) {
        console.error(err)
        next(err);
    }
    res.redirect('/profile');
})

module.exports = router;