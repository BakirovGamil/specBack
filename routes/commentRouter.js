const express = require('express')
const commentController = require('../controllers/commentController');
const commentsRouter = express.Router();

commentsRouter.get('/', commentController.getAll);

const roles = ["user", "specialist"];

commentsRouter.use((req, res, next) => {
    if(!roles.includes(req.session.role)) return res.status(403).json({message: "Не достаточно прав!"});

    next();
});

commentsRouter.post('/add', commentController.add);

module.exports = commentsRouter;