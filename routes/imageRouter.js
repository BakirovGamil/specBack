const express = require('express')
const path = require('path');
const multer = require('multer');
const imageController = require('../controllers/imageController');
const imageRouter = express.Router();

const imageFilter = (req, file, cb) => {
	if (file.mimetype.startsWith('image')) {
		cb(null, true);
	} else {
		cb(null, false);
	}
};

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, path.resolve(path.dirname(require.main.filename), 'images'));
	},
	filename: (req, file, cb) => {
		cb(null, `${Date.now()}-image-${file.originalname}`);
	}
});

const upload = multer({ storage: storage, fileFilter: imageFilter });

imageRouter.get('/', imageController.getAll);

//Даем доступ к api ниже только если это пользователь или специалист
imageRouter.use((req, res, next) => {
    if(!(req.session.role === "user" || req.session.role === "specialist")) return res.status(403).json({message: "Не достаточно прав!"});

    next();
});

imageRouter.post('/uploadImage', upload.single('image'), imageController.uploadImage);

module.exports = imageRouter;