const {Schema, model} = require('mongoose');

const chatSchema = new Schema({
    id: {type: String, required: true, unique: true},
    firstUser: {type: Schema.Types.ObjectId, required:true, ref: "User"},
    secondUser: {type: Schema.Types.ObjectId, required:true, ref: "User"}
});

module.exports = model("Chat", chatSchema);