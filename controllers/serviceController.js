const Specialist = require('../scheme/specialist');
const User = require('../scheme/user');
const Service = require('../scheme/service');

//Можно не проверять req.session.login, т.к. без авторизации доступно только получение данных

exports.add = async function (req, res, next) {
    try{
        console.log("Запрос на добавление услуги");
        const {name, price} = req.body;

        const user = await User.findOne({login: req.session.login});
        const specialist = await Specialist.findOne({user: user._id});

        const service = new Service({id: Date.now(), specialistId: specialist.id, name, price});
        await service.save();

        res.status(200).json({message: "Услуга успешно добавлена"});
    } catch(e) {
        console.log(e.message);
        res.sendStatus(500);
    }
};

exports.getBySpecialistId = async function (req, res, next) {
    try{
        const id = req.params.id;

        const service = await Service.find({specialistId: id}).lean();
        prepareObjToSend(service);

        res.status(200).json(service);
    } catch(e) {
        console.log(e.message);
        res.sendStatus(500);
    }
};

exports.getAll = async function (req, res, next) {
    try{
        console.log("Запрос на получение данных о сервисах");
        const {limit, offset, ...query} = req.query;
        const services = await Service.find(query).skip(offset).limit(limit).lean();
        prepareObjToSend(services);

        res.status(200).json(services);
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