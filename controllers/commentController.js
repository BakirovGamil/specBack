const Comment = require('../scheme/comment');
const User = require('../scheme/user');
const Specialist = require('../scheme/specialist');

exports.getAll = async function (req, res, next) {
    try{
        const {limit, offset, ...query} = req.query;

        const comments = await Comment.find({...query}).skip(offset).limit(limit).lean();

        res.status(200).json(comments);
    } catch(e) {
        console.log(e.message);
        res.sendStatus(500);
    }
};

exports.add = async function (req, res, next) {
    try{
        const {services, rating, specialistId, data} = req.body;

        const user = await User.findOne({login: req.session.login});
        const specialist = await Specialist.findOne({id: specialistId});
        const trimmedData = data.trim();

        if(specialist.user === user._id) return res.status(400).json({message: "Нельзя оставлять отзыв самому себе!"});
        if(!specialist) return res.status(400).json({message: "Специалист не существует!"});
        if(rating < 1 || rating > 5 ) return res.status(400).json({message: "Некорректно указан рейтинг!"});
        if(trimmedData.length <= 20) return res.status(400).json({message: "Длина отзыва должна быть больше 20 символов"});

        const comment = await Comment.findOne({ userId: user.id, specialistId});
        if(comment) return res.status(400).json({message: "Вы уже оставляли отзыв!"});

        const candidateComment = {
            id: Date.now(), 
            userId: user.id, 
            specialistId, 
            services, 
            rating,
            data, 
            date: (new Date()).toDateString()
        };

        const newComment = new Comment(candidateComment);
        await newComment.save();

        res.status(200).json(candidateComment);
    } catch(e) {
        console.log(e.message);
        res.sendStatus(500);
    }
};