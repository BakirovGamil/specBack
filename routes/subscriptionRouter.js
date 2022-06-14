const express = require('express')
const subscriptionRouter = express.Router();
const subscriptionController = require('../controllers/subscriptionController');

subscriptionRouter.get('/getNotArchived', subscriptionController.getNotArchived);

//Даем доступ к api ниже только если это пользователь или специалист
const roles = ['user', 'specialist', 'admin']
subscriptionRouter.use((req, res, next) => {
    if(!roles.includes(req.session.role)) return res.status(403).json({message: "Недостаточно прав!"});

    next();
});

subscriptionRouter.use(subscriptionController.updateExpired);

subscriptionRouter.post('/buy', subscriptionController.buySubscription);
subscriptionRouter.post('/addOrder', subscriptionController.addOrder);
subscriptionRouter.post('/acceptOrderById', subscriptionController.acceptOrderById);
subscriptionRouter.post(
    '/updateActiveOrderSpecialistByOrderId', 
    subscriptionController.updateActiveOrderSpecialistByOrderId
);
subscriptionRouter.get(
    '/getActiteOrderBySpecialist',
     subscriptionController.getActiteOrderBySpecialist
    );
subscriptionRouter.get('/getcurrentsubs', subscriptionController.getCurrentSubs);
subscriptionRouter.get('/getcurrentexperiedsubs', subscriptionController.getCurrentExperiteSubs);
subscriptionRouter.get('/getcurrentactiveorders', subscriptionController.getCurrentActiveOrders);
subscriptionRouter.get('/getordersforspecialist', subscriptionController.getOrdersForSpecialist);
subscriptionRouter.delete('/deleteactiveorderbyid', subscriptionController.deleteActiveOrderById);

subscriptionRouter.use((req, res, next) => {
    if(req.session.role !== "admin") return res.status(403).json({message: "Недостаточно прав!"});

    next();
});

subscriptionRouter.get('/getArchived', subscriptionController.getArchived);
subscriptionRouter.get('/getAll', subscriptionController.getAll);
subscriptionRouter.get(
    '/getSpecialistsBySubscriptionId', 
    subscriptionController.getSpecialistsBySubscriptionId
);
subscriptionRouter.post('/add', subscriptionController.addSubscription);
subscriptionRouter.post("/edit", subscriptionController.edit);
subscriptionRouter.post('/updateisinarchive', subscriptionController.updateIsInArchive);
subscriptionRouter.post("/addspecialisttosubs", subscriptionController.addSpecialistToSubs);
subscriptionRouter.delete(
    '/deletespecialistsbysubscriptionid', 
    subscriptionController.deleteSpecialistsBySubscriptionId
);

module.exports = subscriptionRouter;



