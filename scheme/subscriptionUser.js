const {Schema, model} = require('mongoose');

const subscriptionUserScheme = new Schema({
    id: {type: String, required: true, unique: true},
    subscription:  {type: Schema.Types.ObjectId, required: true, ref: "Subscription"},
    user:  {type: Schema.Types.ObjectId, required: true, ref: "User"},
    date: {type: Number, required: true},
    expiredAt: {type: Number, required: true},
    counter: {type: Number, required: true},
    active: {type: Boolean, required: true},
});

module.exports = model("SubscriptionUser", subscriptionUserScheme);