const express = require('express')
const serviceController = require('../controllers/serviceController');
const serviceRouter = express.Router();

serviceRouter.get('/', serviceController.getAll);
serviceRouter.get('/:id', serviceController.getBySpecialistId);

//Даем доступ к api ниже только если это специалист
const roles = ['specialist', 'admin']
serviceRouter.use((req, res, next) => {
    if(!roles.includes(req.session.role)) return res.status(403).json({message: "Недостаточно прав!"});

    next();
});

serviceRouter.post('/add', serviceController.add);
serviceRouter.post('/update', serviceController.update);
serviceRouter.delete('/delete', serviceController.delete);

module.exports = serviceRouter;