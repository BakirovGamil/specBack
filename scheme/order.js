const {Schema, model} = require('mongoose');

const orderSchema = new Schema({
    id: {type: String, required: true, unique: true},
    userId: {type: String, required: true},
    subscriptionId: {type: String, required: true},
    subscriptionUser: {type: Schema.Types.ObjectId, required: true, ref: "SubscriptionUser"},
    comment: {type: String},
    isActive: {type: Boolean, required: true}
});

module.exports = model("Order", orderSchema);