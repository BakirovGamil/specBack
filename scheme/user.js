const {Schema, model} = require('mongoose');

const userScheme = new Schema({
    id: {type: String, required:true, unique: true},
    lastName: {type: String, required: true},
    firstName: {type: String, required: true},
    middleName: {type: String},
    login: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    phoneNumber: {type: String, required: true},
    role: {type: String, required: true},
    isBanned: {type: Boolean, required: true},
    date: {type: String, required: true}
});

module.exports = model("User", userScheme);