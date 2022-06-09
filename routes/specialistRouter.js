const express = require('express')
const specialistController = require('../controllers/specialistController');
const specialistRouter = express.Router();

specialistRouter.get('/', specialistController.getAll);
specialistRouter.get('/:id', specialistController.getById);
specialistRouter.get('/getByUserId/:userId', specialistController.getByUserId);
specialistRouter.get('/getAll/ByName', specialistController.getAllByName);
specialistRouter.get('/getAll/ByProfession', specialistController.getAllByProfession);

// specialistRouter.get('/get/currentspecialist', specialistController.getCurrentSpecialist);

//Даем доступ к api ниже только если это пользователь или специалист
const roles = ['user', 'specialist', 'admin']
specialistRouter.use((req, res, next) => {
    if(!roles.includes(req.session.role)) return res.status(403).json({message: "Недостаточно прав!"});

    next();
});

specialistRouter.get('/get/currentspecialist', specialistController.getCurrentSpecialist);
specialistRouter.post('/registration', specialistController.registration);
specialistRouter.post('/update/about', specialistController.updateAbout);
specialistRouter.post('/update/experience', specialistController.updateExperience);
specialistRouter.post('/update/professions', specialistController.updateProfessions);

specialistRouter.use((req, res, next) => {
    if(!(req.session.role === "admin")) return res.status(403).json({message: "Недостаточно прав!"});

    next();
});

specialistRouter.post('/update/isverify', specialistController.updateIsVerify);

module.exports = specialistRouter;