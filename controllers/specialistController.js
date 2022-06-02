const Specialist = require('../scheme/specialist');
const User = require('../scheme/user');
const Image = require('../scheme/Image');

//Можно не проверять req.session.login, т.к. без авторизации доступно только получение данных

exports.registration = async function (req, res, next) {
    try{
        console.log("Запрос на регистрацию специалиста");
        const {about, experience} = req.body;
        const user = await User.findOne({login: req.session.login});
        
        const candidate = await Specialist.findOne({user: user._id});
        if(candidate) {
            return res.status(400).json({message: "Такой специалист уже существует"});
        }

        const newSpecialist = new Specialist({id: Date.now(), user: user._id, about, experience});
        await newSpecialist.save();
        await User.updateOne({_id: user._id}, {role: "specialist"});
        req.session.role = "specialist";

        prepareObjToSend(newSpecialist);

        res.status(200).json({message: "Специалист успешно зарегестрирован", body: newSpecialist});
    } catch(e) {
        console.log(e.message);
        res.sendStatus(500);
    }
};

exports.getById = async function (req, res, next) {
    try{
        console.log("Запрос на получение данных о специалисте");
        const id = req.params.id;

        const specialist = await Specialist.findOne({id}).populate("user").lean();
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
        const specialists = await Specialist.find(query).skip(offset).limit(limit).populate('user').lean();
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