const {Schema, model} = require('mongoose');

const imageSchema = new Schema({
    id: {type: String, required:true, unique: true},
    userId: {type: "String", required: true},
    filename: {type: String, unique: true, required: true},
    mimetype: {type: String, required: true},
    description: {type: String},
    type: {type: String, required: true} // "avatar", "gallery"
});

module.exports = model("Image", imageSchema);

