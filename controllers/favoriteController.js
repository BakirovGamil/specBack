const Specialist = require('../scheme/specialist');
const User = require('../scheme/user');
const Favorite = require('../scheme/favorite');

exports.getByUserId = async function (req, res) {
    try{
        const userId = req.params.userId;

        const user = await User.findOne({login: req.session.login});

        if(user.id !== userId) return res.status(403).json({message: "Недостаточно прав!"});
        
        const favorites = await Favorite.find({userId}).populate({
            path : 'specialist',
            populate : {
              path : 'user'
            }
        }).lean();
        prepareObjToSend(favorites);

        res.status(200).json(favorites);
    } catch(e) {
        console.log(e.message);
        res.sendStatus(500);
    }
}

exports.add = async function (req, res) {
    try{
        const {specialistId} = req.body;

        const user = await User.findOne({login: req.session.login});
        const specialist = await Specialist.findOne({id: specialistId});
        if(!specialist) return res.status(400).json({message: "Такого специалиста не существует"});
        
        const existingFavorite = await Favorite.findOne({userId: user.id, specialistId, specialist: specialist._id});
        if(existingFavorite) return res.status(400).json({message: "Уже в избранных"});
        
        const favorite = {id: Date.now(), userId: user.id, specialistId, specialist: specialist._id};
        await Favorite.create(favorite);

        const addedFavorite = await Favorite.findOne(favorite).populate({
            path : 'specialist',
            populate : {
              path : 'user'
            }
        }).lean();
        prepareObjToSend(addedFavorite);

        res.status(200).json(addedFavorite);
    } catch(e) {
        console.log(e.message);
        res.sendStatus(500);
    }
}

exports.deleteById = async function (req, res) {
    try{
        const {id} = req.body;

        const user = await User.findOne({login: req.session.login});
        const favorite = await Favorite.findOne({id});

        if(favorite.userId !== user.id) return res.status(403).json({message: "Недостаточно прав!"});
        
        await Favorite.deleteOne(favorite);

        res.status(200).json({message: "Специалист удален из избранных"});
    } catch(e) {
        console.log(e.message);
        res.sendStatus(500);
    }
}

function prepareObjToSend(object) {   // Удаляет все опасные и ненужные свойства
    const filter = ["_id", "login", "password", "__v"];
    for(let [key, value] of Object.entries(object)) {
        if(filter.includes(key)) {
            delete object[key];
        }

        if(typeof value === "object") prepareObjToSend(value)
    }
}