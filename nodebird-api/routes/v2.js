const express = require('express')
const jwt = require('jsonwebtoken');
const cors = require('cors');
const url = require('url')

const { verifyToken,apiLimiter, premiumapiLimiter } = require('./middlewares');
const { Domain, User, Post, Hashtag } = require('../models') 

const router = express.Router()

// access-control-allow-Origin 헤더를 응답 헤더에 넣어주면 CORS error 해결 가능 -> 이를 위한 'cors' 패키지를 install 후 -> 아래와 같이 middleware로 사용해준다.
// router.use(cors());

// 위의 router.use(cors())는 아래의 코드와 같은 역할을 한다
// 아래와 같은 작성을 통해 middlware customize가 가능하다.
// router.use((req,res,next)=>{
//     cors()(req,res,next)
// })

// router.use(cors())는 모든 url에 관한 cors을 allow 해준다. 이에 아래와 같은 customize를 해준다.
router.use(async (req, res, next) => {
    const domain = await Domain.findOne({
      where: { host: url.parse(req.get('origin')).host },
    });
    if (domain) {
      cors({ origin: req.get('origin') })(req, res, next);
    } else {
      next();
    }
  });

// Free or Premium 사용자에 따른 차등적인 ApiLimiter 적용
router.use(async (req,res,next)=>{
    console.log(url.parse(req.get('origin')).host)
    const domain = await Domain.findOne({
        where: { host : url.parse(req.get('origin')).host},
    })
    console.log(domain.type)
    if (domain.type === 'premium') {
        premiumapiLimiter(req,res,next)
    } else {
        apiLimiter(req,res,next)
    }
})

// Token 생성 Router
// User가 이전에 생성한 clientSecret Key로 jwt Token 생성 POST 요청 대응 router
router.post('/token',  async (req,res) => {
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

router.get('/test', verifyToken,  (req,res) => {
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

