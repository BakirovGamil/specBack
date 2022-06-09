const Specialist = require('../scheme/specialist');
const User = require('../scheme/user');
const Service = require('../scheme/service');

//Можно не проверять req.session.login, т.к. без авторизации доступно только получение данных
const existUnits = ["₽/Услуга", "₽/Час"];

exports.add = async function (req, res, next) {
    try{
        console.log("Запрос на добавление услуги");
        const {name, price, unit} = req.body;

        const user = await User.findOne({login: req.session.login});
        const specialist = await Specialist.findOne({user: user._id});

        if(!existUnits.includes(unit)) return res.status("400").json({message: "Такой единицы измерения не существует!"});

        const service = new Service({id: Date.now(), specialistId: specialist.id, name, price, unit});
        await service.save();

        res.status(200).json(service);
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

exports.update = async function (req, res, next) {
    try{
        const {id, name, price, unit} = req.body;

        const shouldUpdateService = await Service.findOne({id});
        const user = await User.findOne({login: req.session.login});
        const specialist = await Specialist.findOne({user: user._id});

        if(specialist.id !== shouldUpdateService.specialistId) return res.status(403).json({message: "Недостаточно прав!"});
        if(!existUnits.includes(unit)) return res.status("400").json({message: "Такой единицы измерения не существует!"});

        await Service.updateOne(shouldUpdateService, {name, price, unit});

        const updatedService = await Service.findOne({id});

        res.status(200).json(updatedService);
    } catch(e) {
        console.log(e.message);
        res.sendStatus(500);
    }
}

exports.delete = async function (req, res, next) {
    try{
        const {id} = req.body;

        const shouldDeleteService = await Service.findOne({id});
        const user = await User.findOne({login: req.session.login});
        const specialist = await Specialist.findOne({user: user._id});

        if(specialist.id !== shouldDeleteService.specialistId) return res.status(403).json({message: "Недостаточно прав!"});
        
        await Service.deleteOne(shouldDeleteService);

        res.status(200).json({message: "Услуга удалена"});
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