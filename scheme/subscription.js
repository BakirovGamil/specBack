const {Schema, model} = require('mongoose');

const subscriptionScheme = new Schema({
    id: {type: String, required:true, unique: true},
    title: {type: String, required: true, unique: true},
    description: [{type: String, required: true}],
    imgUrl: {type: String},
    price: {type: Number, required: true},
    months: {type: Number, required: true},
    backgroundColor: {type: String, required: true},
    color: {type: String, required: true},
    limit:  {type: Number, required: true},
    isInArchive: {type: Boolean, required: true}
});

module.exports = model("Subscription", subscriptionScheme);