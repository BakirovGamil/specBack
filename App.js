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
const authorizationController = require('./controllers/autorizationController');

const app = express()

const cors = require('cors');
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
apiRouter.get('/logout', authorizationController.logout);
apiRouter.get('/getCurrentUser', authorizationController.getCurrentUser);

apiRouter.use("/specialist", specialistRouter);
apiRouter.use("/image", imageRouter);
apiRouter.use("/service", serviceRouter);
apiRouter.use("/comment", commentRouter);
//

app.get('*', (req,res) =>{
    res.sendFile(path.join(__dirname, 'build/index.html'));
});

const start = async function() {
    try{
        mongoose.connection.on('connected', () => console.log(`Удачное подключение к бд '${conf.mongoUrl}'`));
        await mongoose.connect(conf.mongoUrl);
        app.listen(conf.port, () => console.log(`Удачный запуск сервера на порте ${conf.port}`));
    } catch(e) {
        console.log(e.message);
    }
}

start();