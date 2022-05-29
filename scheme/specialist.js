const {Schema, model} = require('mongoose');

// const specialistSchema = new Schema({
//     id: {type: String, required:true, unique: true},
//     user: {type: Schema.Types.ObjectId, required:true, unique: true, ref: "User"},
//     avatar: {type: String, required: true},
//     about: {type: String, required: true},
//     experience: {type: Schema.Types.Array, required: true},
//     services: [{type: Schema.Types.ObjectId, unique: true, ref: "Service"}]
// });

const specialistSchema = new Schema({
    id: {type: String, required:true, unique: true},
    user: {type: Schema.Types.ObjectId, required:true, unique: true, ref: "User"},
    about: {type: String, required: true},
    experience: [String]
});


module.exports = model("Specialist", specialistSchema);