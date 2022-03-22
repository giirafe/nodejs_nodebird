const express = require('express')
const jwt = require('jsonwebtoken');
const cors = require('cors');

const { verifyToken, deprecated } = require('./middlewares');
const { Domain, User, Post, Hashtag } = require('../models') 

const router = express.Router()

// v1의 모든 Router에 'deprecated' 미들웨어를 일괄적으로 적용한다.
router.use(deprecated);

// Token 생성 Router
// User가 이전에 생성한 clientSecret Key로 jwt Token 생성 POST 요청 대응 router
router.post('/token', async (req,res) => {
    const { clientSecret } = req.body;
    console.log('v1/token router activated')
    try {
        const domain = await Domain.findOne({
            where: { clientSecret },
            include : {
                model:User,
                attribute:['nick','id'],
            }
        });
        if (!domain) {
            return res.status(401).json({
                code:401,
                message:'Unregistered Domain. Register Your Domain First'
            })
        }
        // jwt.sign을 이용해 token 생성
        const token = jwt.sign({
            id : domain.user.id,
            nick : domain.user.nick,
        }, process.env.JWT_SECRET,{
            // Expire(만료) Time : 1minute으로 설정 및 발급인 설정
            expiresIn: '5m',
            issuer: 'nodebird',
        })
        // jwt 토큰 내용은 다 보이지만 변조할 수 없다.

        return res.json({
            code:200,
            message:'Token Issued',
            token
        })
    } catch (error) {
        return res.status(500).json({
            code:500,
            message:'Server Error'
        })
    }
})
// Response 형식 통일해주는 것이 중요

router.get('/test', verifyToken, (req,res) => {
    // verifyToken에서 넘어온 req.decoded을 통해 verify 성공여부를 판단
    res.json(req.decoded);

} )


router.get('/posts/my', verifyToken, (req,res)=>{
    // req.decoded에 jwt verify의 결과가 들어있기에
    Post.findAll({ where : { userId: req.decoded.id }}).then((posts)=>{
        console.log(posts);
        res.json({
            code:200,
            payload:posts,
        }).catch((error)=>{
            console.error(error);
            return res.status(500).json({
                code:500,
                message:'Server Error',
            })
        })
    })
})

router.get('/posts/hashtag/:title', verifyToken, async (req,res)=>{
    try {
        const hashtag = await Hashtag.find({where : { title: req.params.title }})
        if (!hashtag) {
            return res.status(404).json({
                code:404,
                message: 'Research None Found'
            })
        }
        const posts = await hashtag.getPosts();
        return res.json({
            code:200,
            payload:posts
        })
    } catch (err) {
        console.error(err)
    }
})

// 로그인 되어 있는 사용자의 Followers와 Followings API
router.get('/follow', verifyToken, async (req,res)=>{
    try{
        const user = await User.findOne({where : { id:req.decoded.id} });
        // const follower = await user.getFollowers();
        // 위와 같이 Follower의 목록을 통째로 rendering 해주면 password와 같은 개인정보가 같이 노출되기에 sequelize의 attributes 속성으로 선별한 정보를 rendering
        const follower = await user.getFollowers({attributes : ['id','nick']});
        const following = await user.getFollowings({attributes : ['id','nick']});
        return res.json({
            code:200,
            follower,
            following
        })
    } catch( err ) {
        console.error(err);
        return res.status(500).json({
            code:500,
            message:'Server Error'
        })
    }
})

module.exports = router

