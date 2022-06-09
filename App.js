const express = require('express')
const session = require('express-session');
const mongoStore = require('connect-mongo');
const mongoose = require('mongoose');
const path = require('path');
const conf = require('./config.json');
const specialistRouter = require('./routes/specialistRouter');
const imageRouter = require('./routes/imageRouter');
const serviceRouter = require('./routes/serviceRouter');
const commentRouter = require('./routes/commentRouter');
const favoriteRouter = require('./routes/favoriteRouter');
const subscriptionRouter = require('./routes/subscriptionRouter');
const authorizationController = require('./controllers/autorizationController');
const chatHandlers = require('./lib/chatHandlers');
const http = require('http');
const { Server } = require("socket.io");
const registerMessageHandlers = require('./handlers/messageHandlers');

const app = express()

const cors = require('cors');
const professionRouter = require('./routes/professionRouter');
app.use(cors());

//Парсерсы тела запроса
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

//Сессия
const sessionMiddleware = session({
    secret: conf.session.secret,
    cookie: conf.session.cookie,
    resave: conf.session.resave,
    saveUninitialized: conf.session.saveUninitialized,
    store: mongoStore.create({mongoUrl: conf.mongoUrl})
});
app.use(sessionMiddleware);
app.use((req, res, next) => {
    console.log(req.url);
    next();
});
//Статика
app.use(express.static(path.join(__dirname, 'build')));
app.use(express.static(path.join(__dirname, 'images')));
//Апи сервера
const apiRouter = express.Router();
app.use('/api', apiRouter);

apiRouter.post('/registration',  authorizationController.registration);
apiRouter.post('/login', authorizationController.login);
apiRouter.post('/updateuser', authorizationController.updateUser);
apiRouter.post('/updateIsBanned', authorizationController.updateIsBanned);
apiRouter.get('/logout', authorizationController.logout);
apiRouter.get('/getCurrentUser', authorizationController.getCurrentUser);

apiRouter.use("/specialist", specialistRouter);
apiRouter.use("/image", imageRouter);
apiRouter.use("/service", serviceRouter);
apiRouter.use("/comment", commentRouter);
apiRouter.use("/favorite", favoriteRouter);
apiRouter.use("/profession", professionRouter);
apiRouter.use("/subscription", subscriptionRouter);
//
app.get('*', (req,res) =>{
    res.sendFile(path.join(__dirname, 'build/index.html'));
});

//

const start = async function() {
    try{
        mongoose.connection.on('connected', () => console.log(`Удачное подключение к бд '${conf.mongoUrl}'`));
        await mongoose.connect(conf.mongoUrl);

        const server = http.createServer(app);
        const io = new Server(server, {cors: "*"});
        const messagesNamespace = io.of("/messages");
        messagesNamespace.use(function(socket, next) {
            sessionMiddleware(socket.request, socket.request.res, next);
        });

        const chatsNamespace = io.of("/chats");
        chatsNamespace.use(function(socket, next) {
            sessionMiddleware(socket.request, socket.request.res, next);
        });
       
        async function handleSoketConnection(socket) {
            console.log('Пользователь подключился');
            socket.on('disconnect', () => {
                console.log('Пользователь отключился')
            });

            const req = socket.request;
            if(!req.session.login) return socket.disconnect();  //Если не авторизован

            const { secondUserId } = socket.handshake.query;
            const chat = await chatHandlers.getChat(req, secondUserId, io.of("/chats")); 
            console.log(chat);
            if(!chat) return socket.disconnect(); //null если не существует пользователя secondUserId

            socket.roomId = chat.id;
            socket.join(chat.id);
        
            registerMessageHandlers(io.of("/messages"), socket);
            
            socket.on('disconnect', () => {
                console.log('User disconnected')
                socket.leave(chat.id);
            });
        }
        messagesNamespace.on('connection', handleSoketConnection);
        chatsNamespace.on('connection', (socket) => {
            console.log("Подключился");
            const req = socket.request;
            if(!req.session.login) return socket.disconnect();  //Если не авторизован
            
            socket.roomId = req.session.login;
            socket.join(req.session.login);
            chatHandlers.registerChatHandlers(io.of('chats'), socket);
        });

        server.listen(conf.port, () => console.log(`Удачный запуск сервера на порте ${conf.port}`));
    } catch(e) {
        console.log(e.message);
    }
}

start();