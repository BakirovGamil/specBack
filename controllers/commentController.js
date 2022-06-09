const Comment = require('../scheme/comment');
const User = require('../scheme/user');
const Specialist = require('../scheme/specialist');

exports.getAll = async function (req, res, next) {
    try{
        const {limit, offset, ...query} = req.query;

        const comments = await Comment.find({...query}).sort({ $natural: -1 }).skip(offset).limit(limit).populate("user").lean();

        prepareObjToSend(comments);
        res.status(200).json(comments);
    } catch(e) {
        console.log(e.message);
        res.sendStatus(500);
    }
};

exports.getCommentStatsOfSpecialist = async function (req, res, next) {
    try{
        const {specialistId} = req.query;

        const specialist = await Specialist.findOne({id: specialistId});
        if(!specialist) return res.status(400).json({message: "Специалист не существует!"});
        const numberOfComments = await Comment.countDocuments({specialistId});
        const comments = await Comment.find({specialistId});

        const averageRating = Math.round(comments.reduce((prev, comment) => prev + comment.rating, 0) / numberOfComments * 100) / 100;

        res.status(200).json({averageRating, numberOfComments});
    } catch(e) {
        console.log(e.message);
        res.sendStatus(500);
    }
};

exports.getCommentForUser = async function (req, res, next) {
    try{
        const {specialistId} = req.query;

        const user = await User.findOne({login: req.session.login});
        const comment = await Comment.findOne({specialistId, user: user._id}).populate("user").lean();

        if(!comment) return res.status(400).json({message: "Не оставлял комментарий!"});

        prepareObjToSend(comment);
        res.status(200).json(comment);
    } catch(e) {
        console.log(e.message);
        res.sendStatus(500);
    }
};

exports.add = async function (req, res, next) {
    try{
        const {rating, specialistId, data} = req.body;

        const user = await User.findOne({login: req.session.login});
        const specialist = await Specialist.findOne({id: specialistId});
        const trimmedData = data.trim();

        if(!specialist) return res.status(400).json({message: "Специалист не существует!"});
        if(specialist.user === user._id) return res.status(400).json({message: "Нельзя оставлять отзыв самому себе!"});
        if(rating < 1 || rating > 5 ) return res.status(400).json({message: "Некорректно указан рейтинг!"});
        if(trimmedData.length <= 20) return res.status(400).json({message: "Длина отзыва должна быть больше 20 символов"});

        const comment = await Comment.findOne({ user: user._id, specialistId});
        if(comment) return res.status(400).json({message: "Вы уже оставляли отзыв!"});

        const candidateComment = {
            id: Date.now(), 
            user: user._id, 
            specialistId,
            rating,
            data, 
            date: (new Date()).toDateString()
        };

        const newComment = new Comment(candidateComment);
        await newComment.save();
        const addedComment = await Comment.findOne({ user: user._id, specialistId}).populate("user").lean();

        res.status(200).json(addedComment);
    } catch(e) {
        console.log(e.message);
        res.sendStatus(500);
    }
};


exports.update = async function (req, res, next) {
    try{
        const {rating, specialistId, data} = req.body;

        const user = await User.findOne({login: req.session.login});
        const specialist = await Specialist.findOne({id: specialistId});
        const trimmedData = data.trim();


        if(!specialist) return res.status(400).json({message: "Специалист не существует!"});
        if(specialist.user === user._id) return res.status(400).json({message: "Нельзя оставлять отзыв самому себе!"});
        if(rating < 1 || rating > 5 ) return res.status(400).json({message: "Некорректно указан рейтинг!"});
        if(trimmedData.length <= 20) return res.status(400).json({message: "Длина отзыва должна быть больше 20 символов"});
        
        await Comment.updateOne({user: user._id, specialistId}, {rating, data});
        const comment = await Comment.findOne({user: user._id, specialistId}).populate("user").lean();
        prepareObjToSend(comment);

        res.status(200).json(comment);
    } catch(e) {
        console.log(e.message);
        res.sendStatus(500);
    }
};

exports.delete = async function (req, res, next) {
    try{
        const {specialistId} = req.body;

        const user = await User.findOne({login: req.session.login});
        const specialist = await Specialist.findOne({id: specialistId});

        if(!specialist) return res.status(400).json({message: "Специалист не существует!"});
        
        const comment = await Comment.findOne({ user: user._id, specialistId});
        if(!comment) return res.status(400).json({message: "Вы не оставляли отзыв!"});

        await Comment.deleteOne({user: user._id, specialistId});

        res.status(200).json({message: "Отзыв успешно удален"});
    } catch(e) {
        console.log(e.message);
        res.sendStatus(500);
    }
};

function prepareObjToSend(object) {   // Удаляет все опасные и ненужные свойства
    const filter = ["_id", "login", "password", "__v"];
    for(let [key, value] of Object.entries(object)) {
        if(filter.includes(key)) {
            delete object[key];
        }

        if(typeof value === "object") prepareObjToSend(value)
    }
}