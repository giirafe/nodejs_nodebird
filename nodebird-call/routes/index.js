const axios = require('axios');
// const { request } = require('express');
const express = require('express');
const { User } = require('../../nodebird-api/models');
const router = express.Router();

// nodebird-call ==> nodebird-api
router.get('/test', async(req,res,next)=>{
    console.log('/test router acitvated')
    try {
        // 유효기간이 만료되기 전까지는 session에 token을 저장해준다.
        if (!req.session.jwt) {
            // Axios 이용한 token 발급 POST request
            const tokenResult = await axios.post('http://localhost:8002/v2/token',{
                clientSecret: process.env.CLIENT_SECRET,
            })
            // 발급받은 Token을 req.session.jwt에 저장해준다.
            if (tokenResult.data && tokenResult.data.code === 200){
                console.log(tokenResult.data.message)
                req.session.jwt = tokenResult.data.token;
            } else { // Token 발급에 실패했을 때 -> 그 원인을 return 해준다.
                return res.json(tokenResult.data);
            }
        }

        // 토큰이 이미 발급돼 있는 상태일 때 -> 테스트 
        const result = await axios.get('http://localhost:8002/v2/test',{
            // 발급돼 있는 Token을 이용하여 Test 시행
            headers: { authorization : req.session.jwt },
        });
        return res.json(result.data);
    } catch (error){
        console.log('Error from Call side')
        console.error(error);
        if (error.response.status === 419) {
            return res.json(error.response.data);
        }
        return next(error);
    }
})

const request = async (req,api) => {
    try {
        if(!req.session.jwt) {
            const tokenResult = await axios.post('http://localhost:8002/v2/token',{
                clientSecret: process.env.CLIENT_SECRET,
            })
            req.session.jwt = tokenResult.data.token;
        }
        return await axios.get(`http://localhost:8002/v2${api}`,{
            headers: { authorization:req.session.jwt },
        })
    } catch(err){
        console.error(err)
        if(err.response.status < 500) {
            return err.response;
        }
        throw err;
    }
}


// mypost -> /posts/my
router.get('/mypost', async (req,res,next) => {
    try{
        const result = await request(req,'/posts/my');
        res.json(result.data)
    } catch(err){
        console.error(err)
        next(err)
    }
})

// search -> /posts/hashtag
router.get('/search/:hashtag', async (req,res,next)=>{
    try{
        // url주소에 한국어를 쓰면 에러 나기에 방지하고자 encodeURIComponent 사용
        const result = await request(
        req, `/posts/hashtag/${encodeURIComponent(req.params.hashtag)}`)
        res.json(result.data)
    } catch (err) {
        console.error(err);
        next(err)
    }
})

router.get('/follow', async(req,res,next)=>{
    try{
        const result = await request(
        req, `/follow`);
        res.json(result.data)
    } catch (err) {
        console.error(err);
        next(err)
    }
})


router.get('/', (req, res) => {
    res.render('main', { key: process.env.FRONT_SECRET });
  });

module.exports = router;
