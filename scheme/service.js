const {Schema, model} = require('mongoose');

const serviceSchema = new Schema({
    id: {type: String, required: true, unique: true},
    specialistId: {type: String, required: true},
    name: {type: String, required: true},
    price: {type: String, required: true}
});

module.exports = model("Service", serviceSchema);