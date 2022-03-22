const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const Room = require('../schemas/room')
const Chat = require('../schemas/chat')

const router = express.Router();

router.get('/', async(req, res,next) => {
  console.log('Welcome to GIF Chat Service')
  try{
    const rooms = await Room.find({})
    res.render('main',{
      rooms,
      title: "GIF ChatRoom",
      error: req.flash('roomError'),
    })
  } catch(err){
    console.error(err)
    next(err)
  }
});

router.get('/room',(req,res)=>{
  res.render('room', { title: 'GIF Chat Room Create'})
})

router.post('/room',async(req,res,next)=>{
  try{
    // MongoDB의 Room 객체를 형식에 맞춰 생성해준다.
    const room = new Room({
      title:req.body.title,
      max:req.body.max,
      owner: req.session.color,
      password:req.body.password,
    })
    const newRoom = await room.save();
    const io = req.app.get('io');
    // /room 네임스페이스에 'newRoom' event를 emit
    io.of('/room').emit('newRoom',newRoom)
    res.redirect(`/room/${newRoom._id}?password=${req.body.password}`)

  } catch( err){
    console.error(err)
    next(err)
  }
})

// 방에 입장했을 때
router.get('/room/:id',async(req,res,next)=>{
  try{
    const room = await Room.findOne({_id: req.params.id})
    const io = req.app.get('io')
    if (!room){
      req.flash('roomError','존재하지 않는 방입니다')
      return res.redirect('/');
    }
    if (room.password && room.password !== req.query.password){
      req.flash('roomError','비밀번호가 틀렸습니다,')
      return res.redirect('/');
    }
    const { rooms } = io.of('/chat').adapter;
    // 허용인원 초과했을 경우
    if (rooms && rooms[req.params.id] && room.max <= rooms[req.params.id].length){
      req.flash('roomError','허용인원 초과')
      return res.redirect('/');
    }
    // 방에 사용자가 입장하기 전에 존재하던 채팅 rendering
    const chats = await Chat.find({ room:room._id}).sort('createdAt')
    return res.render('chat',{
      room,
      title: room.title,
      chats,
      // 방에 있는 인원들에 관한 정보 number
      number : (rooms && rooms[req.params.id] && rooms[req.params.id] && rooms[req.params.id].length+1) || 0,
      user:req.session.color,
    })
  } catch(err){
    console.error(err)
    next(err)
  }
})

// 방  삭제했을 때
router.delete('/room/:id',async (req,res,next)=>{
  try{
    await Room.remove({ _id : req.params.id }) // 방 지우기
    await Chat.remove( { room:req.params.id} )
    res.send('ok')
    // 방 및 해당 방의 chat을 삭제한 이후에 서비스의 모든 사용자에게 해당 방이 삭제됐다는 'removeRoom' 이벤트 emit (약 2초 후)
    // socket을 Router에서 조작할 때 형식 -> 
    // req.app.get('io').of(네임스페이스).emit(이벤트,데이터)
    setTimeout(()=>{
      req.app.get('io').of('/room').emit('removeRoom',req.params.id);
    },2000)
  } catch (err) {
    console.error(err)
    next(err)
  }
})

router.post('/room/:id/chat',async (req,res,next)=>{
  try {
    const chat = new Chat({
      room : req.params.id,
      user : req.session.color,
      chat : req.body.chat
    })
    await chat.save();
    res.send('ok')
    // socket의 chat 네임스페이스에 room id :id로 사용자가 입력한 chatting을 전달
    // req.app.get('io').of('/chat').to(req.params.id).emit('chat',chat);
    // chat.pug에서 넝어온 sid: socket.id를 이용해 socket에 Event를 Emit해준다.
    req.app.get('io').of('/chat').to(req.params.id).emit('chat',{
      socket:req.body.sid,
      room:req.params.id,
      user:req.session.color,
      chat:req.body.chat
    })

  } catch (err) {
    console.error(err)
    next(err)
  }
})

// uploads 파일에 multer를 이용해 gif 파일을 저장하기에 해당 폴더가 없을 시 '생성'
fs.readdir('uploads',(err)=>{
  if (err) {
    console.error('uploads 폴더가 없어 uploads 폴더를 생성합니다.');
    fs.mkdirSync('uploads')
  } 
})

// gif upload를 위한 multer 객체
const upload = multer({
  storage: multer.diskStorage({
    destination(req,file,cb) {
      cb(null, 'uploads/'); //저장 공간을 'uploads'로 지정
    },
    filename(req,file,cb) {
      const ext =path.extname(file.originalname);
      cb(null, path.basename(file.originalname,ext) + new Date().valueOf() + ext)
    }
  }),
  limits: { fileSize:10 * 1024 * 1024}
})

// gif upload handling Router
// 근데 multer를 미들웨어로 거친
router.post('/room/:id/gif', upload.single('gif'), async (req,res,next)=>{
  try {
    const chat = new Chat({
      room:req.params.id,
      user:req.session.color,
      gif :req.file.filename,
    })
    // chat data를 DB에 저장하기 위한 동기적처리
    await chat.save() 
    res.send('ok')
    // req.app.get('io').of('/chat').to(req.params.id).emit('chat',chat)
    req.app.get('io').of('/chat').to(req.params.id).emit('chat',{
      socket:req.body.sid,
      room:req.params.id,
      user:req.session.color,
      gif:req.file.filename,
    })

  } catch (err) {
    console.error(err)
    next(err)
  }
})

router.post('/room/:id/sys',async(req,res,next)=>{
  console.log('Axios Post Request for Sys Msg Sent')
  try {
    // axios.post 의 body에 오는 type이 join일 시 ? 멘트 할당 or : 멘트 할당
    const chat = req.body.type === 'join'
      ? `${req.session.color}님이 입장하셨습니다`
      : `${req.session.color}님이 퇴장하셨습니다`;
    // DB용 객체 생성
    const sys  = new Chat({
      room: req.params.id,
      user:'system',
      chat,
    })
    // DB 객체 저장
    await sys.save();
    // Socket -> chat 네임스페이스 -> 'axios에서 넘어온 type' Event Emit
    req.app.get('io').of('/chat').to(req.params.id).emit(req.body.type,{
      user:'system',
      chat,
      number: req.app.get('io').of('/chat').adapter.rooms[req.params.id].length
    })
    res.send('ok');

  } catch(err){
    console.error(err)
    next(err)
  }
})

module.exports = router;
