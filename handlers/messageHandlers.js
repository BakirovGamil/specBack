const Chat = require("../scheme/chat");
const Message = require("../scheme/message");
const User = require("../scheme/user");

module.exports = (io, socket) => {
    const req = socket.request;
    const getMessages = async () => {
        try {
            const firstUser = await User.findOne({login: req.session.login});
            const chat = await Chat.findOne({id: socket.roomId});
    
            let secondUserId = null;
            if(!chat.firstUser.equals(firstUser._id)) secondUserId = chat.firstUser
            if(!chat.secondUser.equals(firstUser._id)) secondUserId = chat.secondUser
    
            await Message.updateMany({chatId: socket.roomId, sender: secondUserId, isRead: false}, {isRead: true});
            
            const sockets = await io.in(socket.roomId).fetchSockets();
            if(sockets.length == 2) {
                await Message.updateMany({chatId: socket.roomId, isRead: false}, {isRead: true});
            }
            
            const messages = await Message.find({chatId: socket.roomId}).populate("sender").lean();
            for(let message of messages) {
                prepareObjToSend(message);
            }
            
            // передаем сообщения пользователям, находящимся в комнате
            // синонимы - распространение, вещание, публикация
            io.in(socket.roomId).emit('messages', messages)
        } catch(e) {
            console.log(e);
        }
    }
  
    const addMessage = async (message) => {
        try {
            const {content} = message;
            if(!content) return;
            const user = await User.findOne({login: req.session.login});
            const newMessage = {id: Date.now(), sender: user._id, chatId: socket.roomId, content, isRead: false, date: Date.now()};
            await Message.create(newMessage);

            getMessages()
        } catch(e) {
            console.log(e)
        }
    }
  
    socket.on('message:get', getMessages)
    socket.on('message:add', addMessage)
}

function prepareObjToSend(object) {   // Удаляет все опасные и ненужные свойства
    const filter = ["_id", "login", "password", "__v"];
    for(let [key, value] of Object.entries(object)) {
        if(filter.includes(key)) {
            delete object[key];
        }

        if(typeof value === "object") prepareObjToSend(value)
    }
}