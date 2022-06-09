const express = require('express')
const favoriteController = require('../controllers/favoriteController');
const favoriteRouter = express.Router();

const roles = ["user", "specialist", 'admin'];

favoriteRouter.use((req, res, next) => {
    if(!roles.includes(req.session.role)) return res.status(403).json({message: "Недостаточно прав!"});

    next();
});

favoriteRouter.get('/:userId', favoriteController.getByUserId);
favoriteRouter.post('/add', favoriteController.add);
favoriteRouter.delete('/delete', favoriteController.deleteById);

module.exports = favoriteRouter;