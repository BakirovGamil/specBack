const express = require('express')
const specialistController = require('../controllers/specialistController');
const specialistRouter = express.Router();

specialistRouter.get('/', specialistController.getAll);
specialistRouter.get('/:id', specialistController.getById);

//Даем доступ к api ниже только если это пользователь или специалист
specialistRouter.use((req, res, next) => {
    if(!(req.session.role === "user" || req.session.role === "specialist")) return res.status(403).json({message: "Не достаточно прав!"});

    next();
});

specialistRouter.post('/registration', specialistController.registration);

module.exports = specialistRouter;