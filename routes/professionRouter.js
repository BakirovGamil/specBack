const express = require('express')
const professionController = require('../controllers/professionController');
const professionRouter = express.Router();

professionRouter.get('/getAllByName', professionController.getAllByName);

const roles = ["user", "specialist", "admin"];
//Даем доступ к api ниже только если это специалист
professionRouter.use((req, res, next) => {
    if(!roles.includes(req.session.role)) return res.status(403).json({message: "Недостаточно прав!"});

    next();
});

professionRouter.post('/add', professionController.add);

module.exports = professionRouter;