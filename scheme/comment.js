const {Schema, model} = require('mongoose');

const commentSchema = new Schema({
    id: {type: String, required: true, unique: true},
    user: {type: Schema.Types.ObjectId, required:true, ref: "User"},
    specialistId: {type: String, required: true},
    services: [String],
    rating: {type: Number, required: true},
    data: {type: String, required: true},
    date: {type: String, required: true}
});

module.exports = model("Comment", commentSchema);