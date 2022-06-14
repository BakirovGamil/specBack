const Subscription = require("../scheme/subscription");
const Specialist = require("../scheme/specialist");
const User = require('../scheme/user');
const SubscriptionUser = require("../scheme/subscriptionUser");
const SubscriptionSpecialist = require('../scheme/subsriptionSpecialist');
const HistorySubsUser = require('../scheme/historySubsUser');
const Order = require('../scheme/order');
const { v4: uuidv4 } = require('uuid');

function prepareObjToSend(object) {
    const filter = ["_id", "login", "password", "__v"];
    for(let [key, value] of Object.entries(object)) {
        if(filter.includes(key)) {
            delete object[key];
        }

        if(typeof value === "object") prepareObjToSend(value)
    }
}

async function checkIsNotExpired(subsUser) {
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

exports.addOrder = async function (req, res, next) {
    const {subsUserId, comment} = req.body;

    const authUser = await User.findOne({login: req.session.login});
    const subsUser = await SubscriptionUser.findOne({id: subsUserId, active: true}).populate("subscription");
    if(!subsUser) return res.status(400).json({message: "Подписка истекла или не оформлена"});

    const currentOrder = await Order.findOne({userId: authUser.id, subscriptionUser: subsUser._id, isActive: true})
    if(currentOrder) return res.status(400).json({message: "У вас уже есть активный заказ по этой подписке!"});

    const order = {
        id: uuidv4(), 
        userId: authUser.id, 
        subscriptionId: subsUser.subscription.id, 
        subscriptionUser: subsUser._id, 
        comment, 
        isActive: true
    };
    await Order.create(order);
    
    const addedOrder = await Order.findOne(order).populate({
        path: "subscriptionUser",
        populate: {
            path: "subscription user"
        }
    }).lean();

    prepareObjToSend(addedOrder)
    return res.status(200).json(addedOrder);
}

exports.getCurrentActiveOrders = async function (req, res, next) {
    const authUser = await User.findOne({login: req.session.login});
    const activeOrders = await Order.find({userId: authUser.id, isActive: true}).populate({
        path: "subscriptionUser",
        populate: {
            path: "subscription user"
        }
    }).lean();

    prepareObjToSend(activeOrders)
    return res.status(200).json(activeOrders);
}

exports.deleteActiveOrderById = async function (req, res, next) {
    const {id} = req.body;
    const authUser = await User.findOne({login: req.session.login});
    const activeOrder = await Order.findOne({id, userId: authUser.id, isActive: true});
    if(!activeOrder) return res.status(400).json({message: "Заказ не найден!"});

    await Order.deleteOne({id});

    return res.status(200).json({message: "Заказ удален!"});
}

exports.getOrdersForSpecialist = async function (req, res, next) {
    const authUser = await User.findOne({login: req.session.login});
    if(authUser.role !== "specialist") return res.status(403).json({message: "Недостаточно прав!"});

    const specialist = await Specialist.findOne({user: authUser._id});

    const subscriptionsSpecialist = await SubscriptionSpecialist.find({
        specialist: specialist._id
        })
        .populate("subscription");
    let orders = [];
    for(let subsSpec of subscriptionsSpecialist) {
        const ordersForSubs = await Order
            .find({subscriptionId: subsSpec.subscription.id, isActive: true})
            .sort({ $natural: -1 })
            .populate({
                path: "subscriptionUser",
                populate: {
                    path: "subscription user"
                }
            })
            .lean();

        orders = [...orders, ...ordersForSubs]
    }

    prepareObjToSend(orders);

    return res.status(200).json(orders);
}

exports.addSpecialistToSubs = async function (req, res, next) {
    const {specialistId, subscriptionId} = req.body;

    const subscription = await Subscription.findOne({id: subscriptionId});
    if(!subscription) return res.status(400).json({message: "Такой подписки не существует!"});

    const specialist = await Specialist.findOne({id: specialistId});
    if(!specialist) return res.status(400).json({message: "Такого специалиста не существует!"});

    const currentSubsSpec = await SubscriptionSpecialist.findOne({
        subscription: subscription._id, 
        specialist: specialist._id
    });
    if(currentSubsSpec) return res.status(400).json({message: "Данный специалист уже привязан к этой подписке!"});

    const subscriptionSpecialist = {id: uuidv4(), subscription: subscription._id, specialist: specialist._id};
    await SubscriptionSpecialist.create(subscriptionSpecialist);

    const addedSubscriptionSpecialist = await SubscriptionSpecialist.findOne(subscriptionSpecialist)
        .populate("subscription")
        .populate({
            path: "specialist",
            populate: {
                path: "user professions"
            }
        }).lean();

    prepareObjToSend(addedSubscriptionSpecialist);
    return res.status(200).json(addedSubscriptionSpecialist);
}

exports.getSpecialistsBySubscriptionId = async function (req, res, next) {
    const {id} = req.query;
    const subscription = await Subscription.findOne({id});
    if(!subscription) return res.status(400).json({message: "Такой подписки нет!"});
    const subscriptionSpecialists = await SubscriptionSpecialist.find({
            subscription: subscription._id
        })
        .populate({
            path: "specialist",
            populate: {
                path: "user professions"
            }
        })
        .lean();
    
    let specialists = [];
    for(let subsSpec of subscriptionSpecialists) {
        specialists.push(subsSpec.specialist);
    }

    prepareObjToSend(specialists);
    return res.status(200).json(specialists);
}

exports.deleteSpecialistsBySubscriptionId = async function (req, res, next) {
    const {subscriptionId, specialistId} = req.body;

    const subscription = await Subscription.findOne({id: subscriptionId});
    if(!subscription) return res.status(400).json({message: "Такой подписки нет!"});

    const specialist = await Specialist.findOne({id: specialistId});
    if(!specialist) return res.status(400).json({message: "Специалист не найден"});

    const subsSpec = await SubscriptionSpecialist.findOne({
        subscription: subscription._id, 
        specialist: specialist._id
    });
    if(!subsSpec) return res.status(400).json({message: "Специалист не привязан к подписке!"});

    await SubscriptionSpecialist.deleteOne(subsSpec);

    return res.status(200).json({message: "Специалист отвязан от подписки!"});
}

exports.updateExpired = async function (req, res, next) {
    const authUser = await User.findOne({login: req.session.login});
    const subsUser = await SubscriptionUser.find({user: authUser._id}).populate("subscription user").lean();

    for(let subsOfuser of subsUser) {
        await checkIsNotExpired(subsOfuser);
    }
   
    next();
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
        const subscriptions = await Subscription.find().sort({ isInArchive: -1 });

        res.status(200).json(subscriptions);
    } catch(e) {
        console.log(e.message);
        res.sendStatus(500);
    }
}

exports.edit = async function (req, res, next) {
    try{
        const {id, subscription} = req.body;
        await Subscription.updateOne({id}, subscription);

        const updatedSubs = await Subscription.findOne({id});
        res.status(200).json(updatedSubs);
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
        if(!subscription) return res.status(400).json({message: "Такой подписки нет или она в архиве!"})

        const candidateUserSubscription = await SubscriptionUser.findOne({
                subscription: subscription._id, 
                user: user._id,
                active: true
            })
            .lean();
        if(candidateUserSubscription && await checkIsNotExpired(candidateUserSubscription)) {
            return res.status(400).json({message: "Данная подписка действительна"})
        };

        const currentDate = new Date();
        const months = subscription.months;
        currentDate.setMonth(currentDate.getMonth() + months);
        const expiredAt = currentDate.getTime();

        const newSubsUser = {
            id: uuidv4(), 
            user: user._id, 
            subscription: subscription._id, 
            date: Date.now(), 
            expiredAt, 
            counter: subscription.limit, 
            active: true
        };
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

        const newSubs = {
            id: uuidv4(), 
            title, 
            description, 
            imgUrl, 
            price, 
            months, 
            backgroundColor, 
            color, 
            limit, 
            isInArchive: true
        };
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
        const authUser = await User.findOne({login: req.session.login});
        const subsUser = await SubscriptionUser.find({user: authUser._id, active: true}).populate("subscription user").lean();

        prepareObjToSend(subsUser);
        return res.status(200).json(subsUser);
    } catch(e) {
        console.log(e.message);
        res.sendStatus(500);
    }
}

exports.getCurrentExperiteSubs = async function (req, res, next) {
    try{
        const authUser = await User.findOne({login: req.session.login});
        const subsUser = await SubscriptionUser.find({user: authUser._id, active: false}).populate("subscription user").lean();

        prepareObjToSend(subsUser);
        return res.status(200).json(subsUser);
    } catch(e) {
        console.log(e.message);
        res.sendStatus(500);
    }
}


//По айди заказа
exports.acceptOrderById = async function (req, res, next) {
    try{
        const {id} = req.body;
        const authUser = await User.findOne({login: req.session.login});
        if(authUser.role !== "specialist") return res.status(400).json({message: "Вы не специалист!"});

        const specialist = await Specialist.findOne({user: authUser._id});

        const order = await Order.findOne({id, isActive: true});
        if(!order) return res.status(400).json({message: "Такого заказа нет!"});

        const subscription = await Subscription.findOne({id: order.subscriptionId});
        const subscriptionSpecialist = await SubscriptionSpecialist.findOne({
            specialist: specialist._id, 
            subscription: subscription._id
        });
        if(!subscriptionSpecialist) return res.status(400).json({message: "Вы не привязаны к подписке!"});

        await Order.updateOne(order, {isActive: false});

        const subsUser = await SubscriptionUser.findOne({_id: order.subscriptionUser._id});
        await SubscriptionUser.updateOne(subsUser, {counter: subsUser.counter - 1});

        const newHistory = {
            id: uuidv4(), 
            specialist: specialist._id, 
            order: order._id, 
            isActive: true, 
            date: Date.now()
        };
        await HistorySubsUser.create(newHistory);

        const addedHistory = await HistorySubsUser.findOne(newHistory);
        res.status(200).json(addedHistory);
    } catch(e) {
        console.log(e.message);
        res.sendStatus(500);
    }
}

exports.getActiteOrderBySpecialist = async function (req, res, next) {
    try{
        const authUser = await User.findOne({login: req.session.login});
        if(authUser.role !== "specialist") return res.status(400).json({message: "Вы не специалист!"});

        const specialist = await Specialist.findOne({user: authUser._id});

        const historyOrders = await HistorySubsUser.find({specialist: specialist._id, isActive: true}).sort({ $natural: -1 })
            .populate({
                path: "order",
                populate: {
                    path: "subscriptionUser",
                    populate: {
                        path: "subscription user"
                    }
                }
            }).lean();
        
        let activeOrders = [];
        for(let historyOrder of historyOrders) {
            activeOrders.push({historyOrderId: historyOrder.id, ...historyOrder.order});
        }

        prepareObjToSend(activeOrders);

        res.status(200).json(activeOrders);
    } catch(e) {
        console.log(e.message);
        res.sendStatus(500);
    }
}

exports.updateActiveOrderSpecialistByOrderId = async function (req, res, next) {
    try{
        const {id} = req.body;
        const authUser = await User.findOne({login: req.session.login});
        if(authUser.role !== "specialist") return res.status(400).json({message: "Вы не специалист!"});

        const specialist = await Specialist.findOne({user: authUser._id});

        await HistorySubsUser.updateOne({id,  specialist: specialist._id}, {isActive: false});
        const historyOrders = await HistorySubsUser.find({id, specialist: specialist._id, isActive: true})
            .populate({
                path: "order",
                populate: {
                    path: "subscriptionUser",
                    populate: {
                        path: "subscription user"
                    }
                }
            }).lean();
        
        let activeOrders = [];
        for(let historyOrder of historyOrders) {
            activeOrders.push(historyOrder.order);
        }

        prepareObjToSend(activeOrders);

        res.status(200).json(activeOrders);
    } catch(e) {
        console.log(e.message);
        res.sendStatus(500);
    }
}