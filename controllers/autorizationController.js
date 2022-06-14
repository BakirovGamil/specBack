const crypto = require('crypto');
const conf = require('../config.json');
const Chat = require('../scheme/chat');
const User = require('../scheme/user');
const { v4: uuidv4 } = require('uuid');

exports.registration = async function (req, res, next) {
    try{
        const {firstName, lastName, middleName, login, password, phoneNumber} = req.body;
        const candidate = await User.findOne({login});
        if(candidate) {
            return res.status(400).json({message: "Такой пользователь уже существует"});
        }

        if(!checkBodyRegistration(req, res)) return;

        const hashPassword = crypto.createHmac('sha256', conf.secret.key).update(password).digest('hex');
        const newCandidate = {
            id: uuidv4(), 
            firstName, 
            lastName, 
            middleName, 
            login, 
            password: hashPassword, 
            phoneNumber, 
            role: "user", 
            isBanned: false, 
            date: (new Date()).toDateString()
        };
        const newUser = new User(newCandidate);
        await newUser.save();

        const admin = await User.findOne({id: "1"}); 
        const user = await User.findOne({id: newCandidate.id});
        await Chat.create({id: uuidv4(), firstUser: admin._id, secondUser: user._id})

        const resUser = newCandidate;
        prepareObjToSend(resUser);

        res.status(200).json({message: "Пользователь успешно зарегестрирован", body: resUser});
    } catch(e) {
        console.log(e.message);
        res.sendStatus(500);
    }
};

exports.login = async function (req, res, next) {
    try{
        const {login, password}  = req.body;
        const hashPassword = crypto.createHmac('sha256', conf.secret.key).update(password).digest('hex');
        const candidate = await User.findOne({login, password: hashPassword}).lean();

        if(!checkBodyLogin(req, res)) return;
        if(!candidate) return res.status(400).json({message: "Неверный логин или пароль"});
        if(candidate.isBanned) return res.status(400).json({message: "Аккаунт забанен"});

        req.session.isAuth = true;
        req.session.login = login;
        req.session.role = candidate.role;

        const resUser = candidate;
        prepareObjToSend(resUser);

        res.status(200).json({message: "Авторизация прошла успешно", body: resUser});
    } catch(e) {
        console.log(e.message);
        res.sendStatus(500);
    }
};

exports.logout = async function(req, res) {
    try {
        req.session.destroy();
        res.status(200).json({message: "Успешный выход из аккаунта"});
    } catch (e) {
        console.log(e.message);
        res.sendStatus(500);
    }
}

exports.getCurrentUser = async function(req, res) {
    try {
        if(!req.session.login) return res.status(401).json({message: "Не авторизован"})

        const currentUser = await User.findOne({login: req.session.login}).lean();
        prepareObjToSend(currentUser);

        res.status(200).json(currentUser);
    } catch (e) {
        console.log(e.message);
        res.sendStatus(500);
    }
}

exports.updateUser = async function(req, res) {
    try {
        if(!req.session.login) return res.status(401).json({message: "Не авторизован"});

        const {id, lastName, firstName, middleName} = req.body;
        try {
            checkName(firstName);
            checkName(lastName);
            if(middleName) checkName(middleName);
        } catch (e) {
            return res.status(400).json({message: e.message});
        }
        
        const shouldUpdateUser = await User.findOne({id});

        if(shouldUpdateUser.login !== req.session.login) return res.status(403).json({message: "Недостаточно прав!"});

        await User.updateOne(shouldUpdateUser, {lastName, firstName, middleName});
        const updatedUser = await User.findOne({id}).lean();
        prepareObjToSend(updatedUser);

        res.status(200).json(updatedUser);
    } catch (e) {
        console.log(e.message);
        res.sendStatus(500);
    }
}

exports.updateIsBanned = async function(req, res) {
    try {
        if(!req.session.login) return res.status(401).json({message: "Не авторизован"});
        if(req.session.role !== "admin") return res.status(403).json({message: "Недостаточно прав!"});

        const {id, isBanned} = req.body;
        
        const shouldUpdateUser = await User.findOne({id});

        await User.updateOne(shouldUpdateUser, {isBanned});
        const updatedUser = await User.findOne({id}).lean();
        prepareObjToSend(updatedUser);

        res.status(200).json(updatedUser);
    } catch (e) {
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

checkBodyRegistration = function (req, res) {
    try{
        const {firstName, lastName, middleName, login, password, phoneNumber} = req.body;
        checkName(firstName);
        checkName(lastName);
        if(middleName) checkName(middleName);

        checkLogin(login);
        checkPassword(password);

        checkPhoneNumber(phoneNumber);

        return true;
    } catch(e) {
        res.status(400).json({message: e.message});

        return false;
    }
};

checkBodyLogin = function (req, res) {
    const {login, password} = req.body;
    try{
        checkLogin(login);
        checkPassword(password);
        
        return true;
    } catch(e) {
        res.status(400).json({message: e.message});

        return false;
    }
};

const checkName = (name) => {
    const regExp =  /^[а-яА-ЯёЁ-]+$/;
    const isCyrillic = regExp.test(name);
    const lengthOfName = name.length;

    if(!isCyrillic) throw new Error("В имени допустима только кириллица"); 
    if(!(lengthOfName >= 1 && lengthOfName <= 50)) throw new Error("Допустимая длина имени от 1 до 50");

    return true;
};

const checkLogin = login => {
    const regExp =  /^[\w-]+$/;
    const isLatinDigit = regExp.test(login);
    const lengthOfLogin = login.length;

    if(!isLatinDigit) throw new Error("В логине допустимы только латиница и цифры"); 
    if(!(lengthOfLogin >= 1 && lengthOfLogin <= 50)) throw new Error("Допустимая длина логина от 1 до 50");

    return true;
}; 

const checkPassword = password => {
    const regExp =  /^[\da-zа-яA-ZА-Я]+$/;
    const regDigits = /[\d]/g;
    const regLowerCase = /[a-zа-я]/g;
    const regUpperCase = /[A-ZА-Я]/g; 
    const lengthOfPassword = password.length;

    if(!regDigits.test(password)) throw new Error("Пароль должен содержать хотя бы одну цифру"); 
    if(!(regLowerCase.test(password) && regUpperCase.test(password))) throw new Error("Пароль должен содержать хотя бы один символ другого регистра");
    if(!(lengthOfPassword >= 6 && lengthOfPassword <= 50)) throw new Error("Допустимая длина пароля от 6 до 50");
    if(!(regExp.test(password))) throw new Error("В пароле допустимы только латиница и цифры");

    return true;
};

const checkPhoneNumber = phoneNumber => {
    const regExp =  /^\+7[\d]+$/
    const lengthOfPhoneNumber = phoneNumber.length;
    if(lengthOfPhoneNumber !== 12) throw new Error("Длина номера должна равняться 12");
    if(!regExp.test(phoneNumber)) throw new Error("Неверный формат номера");

    return true;
};