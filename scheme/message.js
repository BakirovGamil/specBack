const {Schema, model} = require('mongoose');

const messageSchema = new Schema({
    id: {type: String, required: true, unique: true},
    chatId: {type: String, required: true},
    sender: {type: Schema.Types.ObjectId, required: true, ref: "User"},
    content: {type: String, required: true},
    isRead: {type: Boolean, required: true},
    date: {type: Number, required: true}
});

module.exports = model("Message", messageSchema);