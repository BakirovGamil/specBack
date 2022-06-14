const User = require("../scheme/user");
const Chat = require("../scheme/chat");


exports.registerChatHandlers = (io, socket) => {
    const req = socket.request;
    const getChats = async () => {
        try {
            const firstUser = await User.findOne({login: req.session.login});
            const chats1 = await Chat.find({firstUser}).populate("firstUser secondUser").sort({ $natural: -1 }).lean();
            const chats2 = await Chat.find({secondUser: firstUser}).populate("firstUser secondUser").sort({ $natural: -1 }).lean();

            const chats = [...chats1, ...chats2];
            for(let chat of chats) {
                prepareObjToSend(chat);
            }

            io.in(req.session.login).emit('chats', chats);
        } catch(e) {
            console.log(e);
        }
    }
  
    socket.on('chats:get', getChats)
}

exports.getChat = async function(req, secondUserId, io) {
    try {
        const firstUser = await User.findOne({login: req.session.login});
        const secondUser = await User.findOne({id: secondUserId});
        
        if(!secondUser) return null;

        const exsistingChat1 = await Chat.findOne({firstUser: firstUser._id, secondUser: secondUser._id});

        if(exsistingChat1)  return exsistingChat1;

        const exsistingChat2 = await Chat.findOne({firstUser: secondUser._id, secondUser: firstUser._id});

        if(exsistingChat2) return exsistingChat2;

        const newChat = {id: Date.now(), firstUser: firstUser._id, secondUser: secondUser._id};
        await Chat.create(newChat);

        const addedChat = await Chat.findOne(newChat);

        io.emit('chats:get');
        return addedChat;
    } catch(e) {
        console.log(e.message);
        console.log(e)
    }
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