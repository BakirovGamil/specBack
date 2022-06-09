const {Schema, model} = require('mongoose');

const historySubsUserScheme = new Schema({
    id: {type: String, required: true, unique: true},
    specialist:  {type: Schema.Types.ObjectId, required: true, ref: "Specialist"},
    date: {type: Number, required: true},
});

module.exports = model("HistorySubsUser", historySubsUserScheme);