const User = require('../scheme/user');
const Image = require('../scheme/Image');
const fs = require('fs');
const path = require('path');

//Можно не проверять req.session.login, т.к. без авторизации доступно только получение данных

const typesOfImage = ["avatar", "gallery", "passport"];

exports.uploadImage = async function (req, res, next) {
    try{
        if(!req.file) return res.status(400).json({message: "Не удалось загрузить фото! Убедитесь, что выбран правильный формат изображения!"});

        const {filename, mimetype} = req.file;
        const {description, type} = req.body;

        if(!typesOfImage.includes(type)) return res.status(400).json({message: "Неправильный тип фотки!"}); 
        if(req.session.role === "user" && type !== "avatar") return res.status(400).json({message: "Недостаточно прав загружать фотки!"}); 
        
        const user = await User.findOne({login: req.session.login});
        const candidateImage = {id: Date.now(), userId: user.id, filename, mimetype, description, type};
        
        if(type === "avatar") {
            const avatars = await Image.find({userId: user.id, type});
            for(let avatar of avatars) {
                const filePath = path.resolve(path.dirname(require.main.filename), 'images', avatar.filename);
                await fs.promises.unlink(filePath);
            }

            await Image.deleteMany({userId: user.id, type});
        }

        const image = new Image(candidateImage);
        await image.save();

        res.status(200).json(candidateImage);
    } catch(e) {
        console.log(e.message);
        res.sendStatus(500);
    }
};

exports.getAll = async function (req, res, next) {
    try{
        const {limit, offset, ...query} = req.query;

        const images = await Image.find({...query}).skip(offset).limit(limit).lean();
        prepareObjToSend(images);

        res.status(200).json(images);
    } catch(e) {
        console.log(e.message);
        res.sendStatus(500);
    }
};

function prepareObjToSend(object) {   // Удаляет все опасные и ненужные свойства
    const filter = ["_id", "login", "password", "__v", "user"];
    for(let [key, value] of Object.entries(object)) {
        if(filter.includes(key)) {
            delete object[key];
        }

        if(typeof value === "object") prepareObjToSend(value)
    }
}