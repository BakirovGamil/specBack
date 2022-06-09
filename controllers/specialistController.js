const Specialist = require('../scheme/specialist');
const User = require('../scheme/user');
const Image = require('../scheme/Image');

//Можно не проверять req.session.login, т.к. без авторизации доступно только получение данных

exports.registration = async function (req, res, next) {
    try{
        console.log("Запрос на регистрацию специалиста");
        const {about, experience, professions} = req.body;
        const user = await User.findOne({login: req.session.login});
        
        const candidate = await Specialist.findOne({user: user._id});
        if(candidate) {
            return res.status(400).json({message: "Cпециалист уже существует"});
        }

        const newSpecialist = new Specialist({id: Date.now(), user: user._id, about, experience, isVerify: false, professions});
        await newSpecialist.save();
        await User.updateOne({_id: user._id}, {role: "specialist"});
        req.session.role = "specialist";

        const specialist = await Specialist.findOne({user: user._id}).populate("user professions").lean();
        prepareObjToSend(specialist);

        res.status(200).json({message: "Специалист успешно зарегестрирован", body: specialist});
    } catch(e) {
        console.log(e.message);
        res.sendStatus(500);
    }
};

exports.getCurrentSpecialist = async function (req, res, next) {
    try{
        console.log("Запрос на получение текущего специалиста");
        const user = await User.findOne({login: req.session.login});
        // const user = await User.findOne({login: "krutoy"});
        
        if(user.role !== "specialist") return res.status(400).json({message: "Вы не специалист!"});

        const specialist = await Specialist.findOne({user: user._id}).populate("user professions").lean();
    
        prepareObjToSend(specialist);

        res.status(200).json(specialist);
    } catch(e) {
        console.log(e.message);
        res.sendStatus(500);
    }
};

exports.getById = async function (req, res, next) {
    try{
        console.log("Запрос на получение данных о специалисте");
        const id = req.params.id;

        const specialist = await Specialist.findOne({id}).populate("user professions").lean();
        if(!specialist) return res.status(404).json({message: "Специалист не найден!"});

        prepareObjToSend(specialist);
        const sHowLongInService = getHowLongInService(specialist.user.date);
        const localeDate = (new Date(specialist.user.date)).toLocaleDateString();
        specialist.experience.push(`На сервисе с ${localeDate} ${sHowLongInService}`);

        res.status(200).json(specialist);
    } catch(e) {
        console.log(e.message);
        res.sendStatus(500);
    }
}

exports.getByUserId = async function (req, res, next) {
    try{
        const userId = req.params.userId;

        const user = await User.findOne({id: userId});
        const specialist = await Specialist.findOne({user: user._id}).populate("user professions").lean();
        console.log(specialist);

        if(!specialist) return res.status(404).json({message: "Специалист не найден!"});

        prepareObjToSend(specialist);
        const sHowLongInService = getHowLongInService(specialist.user.date);
        const localeDate = (new Date(specialist.user.date)).toLocaleDateString();
        specialist.experience.push(`На сервисе с ${localeDate} ${sHowLongInService}`);

        res.status(200).json(specialist);
    } catch(e) {
        console.log(e.message);
        res.sendStatus(500);
    }
}

exports.getAll = async function (req, res, next) {
    try{
        console.log("Запрос на получение данных о специалистах");
        const {limit, offset, ...query} = req.query;
        const specialists = await Specialist.find(query).skip(offset).limit(limit).populate('user professions').lean();
        specialists.forEach(specialist => {
            prepareObjToSend(specialist);
            const sHowLongInService = getHowLongInService(specialist.user.date);
            const localeDate = (new Date(specialist.user.date)).toLocaleDateString();
            specialist.experience.push(`На сервисе с ${localeDate} ${sHowLongInService}`);
        });

        res.status(200).json(specialists);
    } catch(e) {
        console.log(e.message);
        res.sendStatus(500);
    }
}

exports.getAllByName = async function (req, res, next) {
    try{
        const {name, limit = 0} = req.query;
        const specialists = await Specialist.find().limit(limit).populate('user professions').lean();

        const regExp = /\s+/g;
        const filteredQueryName = name.replace(regExp, " ").trim();
        const regExpForFind = new RegExp(filteredQueryName, "gi");

        const filteredSpecialists = specialists.filter(specialist => {
            const user = specialist.user;
            const fullName = [user.lastName, user.firstName, user.middleName].join(" ");
            const filteredName = fullName.replace(regExp, " ").trim();

            return regExpForFind.test(filteredName);
        });
        
        filteredSpecialists.forEach(specialist => {
            prepareObjToSend(specialist);
            const sHowLongInService = getHowLongInService(specialist.user.date);
            const localeDate = (new Date(specialist.user.date)).toLocaleDateString();
            specialist.experience.push(`На сервисе с ${localeDate} ${sHowLongInService}`);
        });

        res.status(200).json(filteredSpecialists);
    } catch(e) {
        console.log(e.message);
        res.sendStatus(500);
    }
}

exports.getAllByProfession = async function (req, res, next) {
    try{
        const {name, limit = 0} = req.query;
        const specialists = await Specialist.find().limit(limit).populate('user professions').lean();

        const regExp = /\s+/g;
        const filteredQueryName = name.replace(regExp, " ").trim();
        const regExpForFind = new RegExp(filteredQueryName, "gi");

        const filteredSpecialists = specialists.filter(specialist => {
            const professions = specialist.professions;
            if(!professions) return false; // у старых докуметов не было поля профессии

            let isFind = false;
            for(let profession of professions) {
                isFind = isFind || regExpForFind.test(profession.name);

                if(isFind) return true;
            }

            return isFind;
        });
        
        filteredSpecialists.forEach(specialist => {
            prepareObjToSend(specialist);
            const sHowLongInService = getHowLongInService(specialist.user.date);
            const localeDate = (new Date(specialist.user.date)).toLocaleDateString();
            specialist.experience.push(`На сервисе с ${localeDate} ${sHowLongInService}`);
        });

        res.status(200).json(filteredSpecialists);
    } catch(e) {
        console.log(e.message);
        res.sendStatus(500);
    }
}

exports.updateAbout = async function (req, res, next) {
    try{
        const {id, about} = req.body;

        const shouldUpdateSpecialist = await Specialist.findOne({id}).populate("user professions");

        if(!shouldUpdateSpecialist) return res.status(404).json({message: "Такого специалиста не существует!"});
        if(shouldUpdateSpecialist.user.login !== req.session.login) return res.status(403).json({message: "Недостаточно прав!"});

        const trimedAbout = about.trim();
        if(trimedAbout.length < 10) return res.status(400).json({message: "Длина `о себе` должна быть больше 10 символов!"});

        await Specialist.updateOne({id}, {about: trimedAbout});
        const updatedSpecialist = await Specialist.findOne({id}).populate("user professions").lean();
        prepareObjToSend(updatedSpecialist);

        res.status(200).json(updatedSpecialist);
    } catch(e) {
        console.log(e.message);
        res.sendStatus(500);
    }
}

exports.updateExperience = async function (req, res, next) {
    try{
        const {id, experience} = req.body;

        const shouldUpdateSpecialist = await Specialist.findOne({id}).populate("user professions");

        if(!shouldUpdateSpecialist) return res.status(404).json({message: "Такого специалиста не существует!"});
        if(shouldUpdateSpecialist.user.login !== req.session.login) return res.status(403).json({message: "Недостаточно прав!"});

        await Specialist.updateOne({id}, {experience});
        const updatedSpecialist = await Specialist.findOne({id}).populate("user professions").lean();
        prepareObjToSend(updatedSpecialist);

        res.status(200).json(updatedSpecialist);
    } catch(e) {
        console.log(e.message);
        res.sendStatus(500);
    }
}

exports.updateProfessions = async function (req, res, next) {
    try{
        const {id, professions} = req.body;

        const shouldUpdateSpecialist = await Specialist.findOne({id}).populate("user professions");

        if(!shouldUpdateSpecialist) return res.status(404).json({message: "Такого специалиста не существует!"});
        if(shouldUpdateSpecialist.user.login !== req.session.login) return res.status(403).json({message: "Недостаточно прав!"});

        await Specialist.updateOne({id}, {professions});
        const updatedSpecialist = await Specialist.findOne({id}).populate("user professions").lean();
        prepareObjToSend(updatedSpecialist);

        res.status(200).json(updatedSpecialist);
    } catch(e) {
        console.log(e.message);
        res.sendStatus(500);
    }
}

exports.updateIsVerify = async function (req, res, next) {
    try{
        const {id, isVerify} = req.body;

        const shouldUpdateSpecialist = await Specialist.findOne({id}).populate("user professions");

        if(!shouldUpdateSpecialist) return res.status(404).json({message: "Такого специалиста не существует!"});

        await Specialist.updateOne({id}, {isVerify});
        const updatedSpecialist = await Specialist.findOne({id}).populate("user professions").lean();
        prepareObjToSend(updatedSpecialist);

        res.status(200).json(updatedSpecialist);
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

function getHowLongInService(date) {
    const nhowLongInService = (new Date()).getFullYear() - (new Date(date)).getFullYear();
    let sHowLongInService;
    switch (nhowLongInService) {
    case 0:
        sHowLongInService = '';
        break;
    case 1:
        sHowLongInService = `(${nhowLongInService} год)`;
        break;
    case 2:
    case 3:
    case 4:
        sHowLongInService = `(${nhowLongInService} года)`;
        break;
    default:
        sHowLongInService = `(${nhowLongInService} лет)`;
    }

    return sHowLongInService;
}