const express = require('express')
const subscriptionController = require('../controllers/subscriptionController');
const subscriptionRouter = express.Router();

subscriptionRouter.get('/getNotArchived', subscriptionController.getNotArchived);

//Даем доступ к api ниже только если это пользователь или специалист
const roles = ['user', 'specialist', 'admin']
subscriptionRouter.use((req, res, next) => {
    if(!roles.includes(req.session.role)) return res.status(403).json({message: "Недостаточно прав!"});

    next();
});

subscriptionRouter.post('/buy', subscriptionController.buySubscription);
subscriptionRouter.get('/getcurrentsubs', subscriptionController.getCurrentSubs);

subscriptionRouter.use((req, res, next) => {
    if(!(req.session.role === "admin")) return res.status(403).json({message: "Недостаточно прав!"});

    next();
});

subscriptionRouter.get('/getArchived', subscriptionController.getArchived);
subscriptionRouter.get('/getAll', subscriptionController.getAll);
subscriptionRouter.post('/add', subscriptionController.addSubscription);
subscriptionRouter.post('/updateisinarchive', subscriptionController.updateIsInArchive);

module.exports = subscriptionRouter;