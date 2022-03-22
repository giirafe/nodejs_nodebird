const SocketIO = require('socket.io');
const axios = require('axios');
const cookieParser = require('cookie-parser');
const cookie = require('cookie-signature');

// app.js에서 webSocket(server)로 연결할 때 아래의 process를 거친다.
// HTTP와 WS는 포트를 공유해서 따로 포트 연결할 필요가 없다..
// Socket.io는 HTTP request로 WebSocket 사용 가능 여부를 묻는다.
module.exports = (server,app,sessionMiddleware) => {
    // client side에서 아래의 /socket.io의 path를 통해 접근한다.
    const io = SocketIO(server, { path:'/socket.io'});
    app.set('io',io); // Express에서의 변수 저장 방법 .set
    // req.app.get('io').of('/room').emit 에서 io를 사용하기 위해 app.set('io',io)를 지정해준다.

    // 네임스페이스
    // io.of('/') : default value
    const room = io.of('/room')
    const chat = io.of('/chat')

    // 스스로 해보기2 Sys 메세지 DB저장 위한 io.use에서의 cookieParser
    io.use((socket, next) => {
        cookieParser(process.env.COOKIE_SECRET)(socket.request, socket.request.res, next)
   });
    // express 서버에서 가져온 sessionMiddleware는 io(웹 소켓)에서도 사용가능하도록 설정
    io.use((socket,next)=>{ // 꼭 알아두자!!
        sessionMiddleware(socket.request, socket.request.res, next)
    })

    // room namespace
    room.on('connection',(socket)=>{
        console.log('room 네임스페이스 접속');
        socket.on('disconnect',()=>{
            console.log('room 네임스페이스 Disconnected')
        })
    })

    // chat namespace
    chat.on('connection', (socket) => {
        console.log('chat 네임스페이스에 접속');
        const req = socket.request; //request는 socket.request에서 추출
        const { headers: { referer } } = req;
        // 방제목을 추출하는 정규식(RE)
        // /room/example_roomId {req.headers.referer}
        const roomId = referer
        .split('/')[referer.split('/').length - 1]
        .replace(/\?.+/, '');

        // 방에 접속
        socket.join(roomId); 
        
        // socket.to(roomId).emit('join', { // 접속 후 해당 방의 roomdId를 통해 emit 시행
        // user: 'system',
        // chat: `${req.session.color}님이 입장하셨습니다.`,
        // // number를 새로운 사용자가 room에 join 할 때마다 '갱신'
        // number: socket.adapter.rooms[roomId].length
        // });
        axios.post(`http://localhost:8005/room/${roomId}/sys`, {
            type: 'join',
        },{ 
            // header에 암호화된 Cookie를 만들어 준다.
            headers: {
                // connect.sid를 생성할 때 s%3A를 임의 추가(식별자로 작용)
                Cookie:`connect.sid=${'s%3A' + cookie.sign(req.signedCookies['connect.sid'],process.env.COOKIE_SECRET)}`,
            },
        })

        // 접속 해제시...
        socket.on('disconnect', () => {
        console.log('chat 네임스페이스 접속 해제');
        socket.leave(roomId); // 방에서 나가기
        const currentRoom = socket.adapter.rooms[roomId]; //이 부분에 방 정보와 인원이 들어있다..
        const userCount = currentRoom ? currentRoom.length : 0;
        if (userCount === 0) { // 방 인원이 없으면 방 제거
            // 여기에서 DB 조작하지 말고 -> 아래와 같이 REST API로 Router를 통해 DB를 조작해야 깔끔하다
            axios.delete(`http://localhost:8005/room/${roomId}`)
            .then(() => {
                console.log('방 제거 요청 성공');
            })
            .catch((error) => {
                console.error(error);
            });
        } else {
            // socket.to(roomId).emit('exit', {
            // user: 'system',
            // chat: `${req.session.color}님이 퇴장하셨습니다.`,
            // number:socket.adapter.rooms[roomId].length,
            // });
            axios.post(`http://localhost:8005/room/${roomId}/sys`, {
                type: 'exit',
            },{ 
                headers: {
                    Cookie:`connect.sid=${'s%3A' + cookie.sign(req.signedCookies['connect.sid'],process.env.COOKIE_SECRET)}`,
                }
            })
        }
        });

        socket.on('dm',(data)=>{
            socket.to(data.target).emit('dm',data);
        })

        socket.on('ban',(data)=>{
            socket.to(data.id).emit('ban');
        })

    });
};