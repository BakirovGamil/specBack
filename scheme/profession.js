const {Schema, model} = require('mongoose');

const professionSchema = new Schema({
    id: {type: String, required: true, unique: true},
    name: {type: String, required: true}
});

module.exports = model("Profession", professionSchema);