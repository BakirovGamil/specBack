const {Schema, model} = require('mongoose');

const subscriptionSpecialistScheme = new Schema({
    id: {type: String, required: true, unique: true},
    subscription:  {type: Schema.Types.ObjectId, required: true, ref: "Subscription"},
    specialist:  {type: Schema.Types.ObjectId, required: true, ref: "Specialist"},
});

module.exports = model("SubscriptionSpecialist", subscriptionSpecialistScheme);