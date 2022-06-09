const express = require('express')
const commentController = require('../controllers/commentController');
const commentsRouter = express.Router();

commentsRouter.get('/', commentController.getAll);
commentsRouter.get('/getCommentStatsOfSpecialist', commentController.getCommentStatsOfSpecialist);

const roles = ["user", "specialist", 'admin'];

commentsRouter.use((req, res, next) => {
    if(!roles.includes(req.session.role)) return res.status(403).json({message: "Недостаточно прав!"});

    next();
});

commentsRouter.get('/getCommentForUser', commentController.getCommentForUser);
commentsRouter.post('/add', commentController.add);
commentsRouter.post('/update', commentController.update);
commentsRouter.delete('/delete', commentController.delete);

module.exports = commentsRouter;