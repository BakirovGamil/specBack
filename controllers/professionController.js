const profession = require('../scheme/profession');

exports.add = async function (req, res) {
    try{
        const {name} = req.body;
        
        const regExp = /\s+/g;
        const filteredName = name.replace(regExp, " ").toLowerCase().trim();

        const candidate = await profession.findOne({name: filteredName});
        if(candidate) return res.status(200).json(candidate);

        const newProfession = {id: Date.now(), name: filteredName};
        await profession.create(newProfession);
        const addedProfession = await profession.findOne(newProfession);

        res.status(200).json(addedProfession);
    } catch(e) {
        console.log(e.message);
        res.sendStatus(500);
    }
}

exports.getAllByName = async function (req, res) {
    try{
        const {name, limit = 0} = req.query;
        
        const regExp = /\s+/g;
        const filteredName = name.replace(regExp, " ").toLowerCase().trim();
        const regExpForSearch = new RegExp(filteredName, "gi");

        const professions = await profession.find({name: regExpForSearch}).limit(limit);

        res.status(200).json(professions);
    } catch(e) {
        console.log(e.message);
        res.sendStatus(500);
    }
}