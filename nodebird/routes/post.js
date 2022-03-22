const express = require('express');
const multer = require('multer');
const path = require('path');

// sequelize model 불러오기
const {Post,Hashtag,User} = require('../models');
const { isLoggedIn } = require('./middlewares');
// const {} = require('../models');

const router = express.Router();

const upload = multer({
    // 현재 서버에 저장하거나 AWS 혹은 Google 클라우드 서비스에 사진을 저장할 수 있다.
    // nodebird의 경우 간단한 프로젝트이기에 현재 서버에 저장하는 방식을 채택하기로 한다.
    storage: multer.diskStorage({
        // 파일경로
        destination(req,file,cb){
            cb(null,'uploads/')
        },
        // filename : 파일명
        filename(req,file,cb){
            const ext = path.extname(file.originalname);
            // cb : callback -> multer 공식 문서 참고하여 사용방식 숙지, 첫번째 인자는 Error를 위한 자리
            // 파일명 중복을 방지하기 위해 현재 시간을 사용하여 파일명 생성
            cb(null, path.basename(file.originalname,ext) + new Date().valueOf() + ext)
        }
    }),
    // 파일의 크기를 아래와 같이 제한
    limit: { fileSize : 5 * 1024 * 1024},
});

// html form 속 input_id가 'img'이기에 이를 매칭시켜준다
router.post('/img',isLoggedIn, upload.single('img'), (req,res)=>{
    console.log(req.body,req.file);
    res.json({url:`/img/${req.file.filename}`});
});

const upload2 = multer();

router.post('/', isLoggedIn, upload2.none(), async (req, res, next) => {
    // 게시글(post) 업로드 처리
    // req에 user.id 전달 여부 확인
    console.log('Sent User id : ',req.user.id)
    try {
      const post = await Post.create({
        content: req.body.content,
        img: req.body.url,
        userId: req.user.id,
      });
      // RE 정규표현식을 이용하여 hashtag 추출
      const hashtags = req.body.content.match(/#[^\s#]*/g);
      if (hashtags) {
        // findOrCreate 있으면 찾고 없으면 새로 생성
        // toLowerCase를 통해 소문자로 통일해서 저장
        const result = await Promise.all(hashtags.map(tag => Hashtag.findOrCreate({
          where: { title: tag.slice(1).toLowerCase() },
        })));
        await post.addHashtags(result.map(r => r[0]));
      }
      res.redirect('/');
    } catch (error) {
      console.error(error);
      next(error);
    }
  });


router.delete('/:id', async(req,res,next)=>{
    try{
        await Post.destroy({ where : { id:req.params.id, userId : req.user.id  }})
        res.send('OK')
    } catch( err ) {
        console.error(err)
        next(err)
    }
})

// 해쉬태그 검색 
router.get('/hashtag',async(req,res,next)=>{
    const query = req.query.hashtag;
    // query문이 없다면 main으로 redirect
    if (!query){
        return res.redirect('/');
    }
    // async에는 try catch 적극 활용
    try {
        const hashtag = await Hashtag.find({where : {title: query }});
        let posts = [];
        // A.getB 관계있는 로우 조회 => hashtag.getPosts
        // query 속 hashtag와 관련된 posts 및 User 정보까지 post에 저장
        if (hashtag){
            posts = await hashtag.getPosts({ include: [{model:User}]})
        }
        // 이후 main.pug에 twits 검색 결과를 rendering 해준다.
        return res.render('main',{
            title: `${query} | NodeBird`,
            user:req.user,
            twits :posts,
        })
    } catch (error) {
        console.error(error);
        next(error)
    }
})

router.post('/:id/like', async(req,res,next)=>{
    console.log('Like Activated')
    try {
        // 현재 request의 user.id로 user를 찾은 후
        const post = await Post.find({ where : { id: req.params.id}});
        // Post의 Like 목록을 A.addB(관계 생성)
        await post.addLiker(req.user.id);
        res.send('OK');
    } catch (error) {
        console.error(error);
        next(error);
    }
})

router.delete('/:id/unlike', async(req,res,next)=>{
    try {
        // 현재 request의 user.id로 user를 찾은 후
        const post = await Post.find({ where : { id: req.params.id}});
        // Post의 Like 목록을 A.addB(관계 생성)
        await post.removeLiker(req.user.id);
        res.send('OK');
    } catch (error) {
        console.error(error);
        next(error);
    }
})

module.exports = router;
