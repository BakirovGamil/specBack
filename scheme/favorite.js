const {Schema, model} = require('mongoose');

const favoriteSchema = new Schema({
    id: {type: String, required:true, unique: true},
    userId: {type: "String", required: true},
    specialistId: {type: "String", required: true},
    specialist: {type: Schema.Types.ObjectId, required: true, ref: "Specialist"},
});

module.exports = model("Favorite", favoriteSchema);