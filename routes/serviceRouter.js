const express = require('express')
const serviceController = require('../controllers/serviceController');
const serviceRouter = express.Router();

serviceRouter.get('/', serviceController.getAll);
serviceRouter.get('/:id', serviceController.getBySpecialistId);

//Даем доступ к api ниже только если это специалист
serviceRouter.use((req, res, next) => {
    if(req.session.role !== "specialist") return res.status(403).json({message: "Не достаточно прав!"});

    next();
});

serviceRouter.post('/add', serviceController.add);

module.exports = serviceRouter;