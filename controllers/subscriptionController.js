const Subscription = require("../scheme/subscription");
const Specialist = require("../scheme/specialist");
const User = require('../scheme/user');
const SubscriptionUser = require("../scheme/subscriptionUser");
const HistorySubsUser = require('../scheme/historySubsUser');

function prepareObjToSend(object) {   // Удаляет все опасные и ненужные свойства
    const filter = ["_id", "login", "password", "__v"];
    for(let [key, value] of Object.entries(object)) {
        if(filter.includes(key)) {
            delete object[key];
        }

        if(typeof value === "object") prepareObjToSend(value)
    }
}

async function checkIsNotExperied(subsUser) {
    if(subsUser.counter === 0) {
        await SubscriptionUser.updateOne(subsUser, {active: false});
        return false;
    }
    
    const currentDate = Date.now();
    if(subsUser.expiredAt < currentDate) {
        await SubscriptionUser.updateOne(subsUser, {active: false});
        return false
    };

    return true;
}

exports.getNotArchived = async function (req, res, next) {
    try{
        const subscriptions = await Subscription.find({isInArchive: false});

        res.status(200).json(subscriptions);
    } catch(e) {
        console.log(e.message);
        res.sendStatus(500);
    }
}

exports.getArchived = async function (req, res, next) {
    try{
        const subscriptions = await Subscription.find({isInArchive: true});

        res.status(200).json(subscriptions);
    } catch(e) {
        console.log(e.message);
        res.sendStatus(500);
    }
}

exports.getAll = async function (req, res, next) {
    try{
        const subscriptions = await Subscription.find();

        res.status(200).json(subscriptions);
    } catch(e) {
        console.log(e.message);
        res.sendStatus(500);
    }
}

exports.buySubscription = async function (req, res, next) {
    try{
        const {id} = req.body;

        const user = await User.findOne({login: req.session.login});

        const subscription = await Subscription.findOne({id, isInArchive: false});
        if(!subscription) return res.status(400).json({message: "Такой подписки нет!"})

        const candidateUserSubscription = await SubscriptionUser.findOne({subscription: subscription._id, user: user._id, active: true}).lean();  //Проверяем есть ли такая подписка
        if(candidateUserSubscription && await checkIsNotExperied(candidateUserSubscription)) {
            // prepareObjToSend(candidateUserSubscription);
            return res.status(400).json({message: "Данная подписка действительна"})
        };

        const currentDate = new Date();
        const months = subscription.months;
        currentDate.setMonth(currentDate.getMonth() + months);
        const expiredAt = currentDate.getTime();

        const newSubsUser = {id: Date.now(), user: user._id, subscription: subscription._id, date: Date.now(), expiredAt, counter: subscription.limit, active: true};
        await SubscriptionUser.create(newSubsUser);

        const addedSubsUser = await SubscriptionUser.findOne(newSubsUser).populate("user subscription").lean();
        prepareObjToSend(addedSubsUser);
        res.status(200).json(addedSubsUser);
    } catch(e) {
        console.log(e.message);
        res.sendStatus(500);
    }
}

exports.addSubscription = async function (req, res, next) {
    try{
        const {title, description, imgUrl, price, months, backgroundColor, color, limit} = req.body;

        const newSubs = {id: Date.now(), title, description, imgUrl, price, months, backgroundColor, color, limit, isInArchive: true};
        await Subscription.create(newSubs);

        const addedSubs = await Subscription.findOne(newSubs);
        res.status(200).json(addedSubs);
    } catch(e) {
        console.log(e.message);
        res.sendStatus(500);
    }
}

exports.updateIsInArchive = async function (req, res, next) {
    try{
        const {id, isInArchive} = req.body;

        await Subscription.updateOne({id}, {isInArchive});
        const updatedSubs = await Subscription.findOne({id});
        res.status(200).json(updatedSubs);
    } catch(e) {
        console.log(e.message);
        res.sendStatus(500);
    }
}

exports.getCurrentSubs = async function (req, res, next) {
    try{
        const {id} = req.query;

        const authUser = await User.findOne({login: req.session.login});
        const user = await User.findOne({id});

        if(req.session.role === "admin") {
            const subsUser = await SubscriptionUser.find({user: user._id, active: true}).populate("subscription user").lean();
            let isActive = true;
            for(let subsOfuser of subsUser) {
                isActive = isActive && await checkIsNotExperied(subsOfuser);
            }

            if(isActive) {
                prepareObjToSend(subsUser);
                return res.status(200).json(subsUser);
            }
           
            const newSubsUser = await SubscriptionUser.find({user: user._id, active: true}).populate("subscription user").lean();
            prepareObjToSend(newSubsUser);
            return res.status(200).json(newSubsUser);
        } else {
            if(authUser.id !== user.id) return res.status(403).json({message: "Недостаточно прав!"});
            const subsUser = await SubscriptionUser.find({user: user._id, active: true}).populate("subscription user").lean();
            let isActive = true;
            for(let subsOfuser of subsUser) {
                isActive = isActive && await checkIsNotExperied(subsOfuser);
            }

            if(isActive) {
                prepareObjToSend(subsUser);
                return res.status(200).json(subsUser);
            }
           
            const newSubsUser = await SubscriptionUser.find({user: user._id, active: true}).populate("subscription user").lean();
            prepareObjToSend(newSubsUser);
            return res.status(200).json(newSubsUser);
        }
    } catch(e) {
        console.log(e.message);
        res.sendStatus(500);
    }
}

// //По айди подписки
// exports.addHistorySubsUser = async function (req, res, next) {
//     try{
//         const {id, specialistId} = req.body;

//         const specialist = await Specialist.findOne({id: specialistId});
//         const newHistory = {id: Date.now(), specialist: specialist._id, date: Date.now()};
        
//         await HistorySubsUser.create(newHistory);

//         const addedHistory = await HistorySubsUser.findOne(newHistory);
//         res.status(200).json(addedHistory);
//     } catch(e) {
//         console.log(e.message);
//         res.sendStatus(500);
//     }
// }