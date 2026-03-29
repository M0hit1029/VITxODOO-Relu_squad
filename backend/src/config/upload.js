const multer = require('multer');

const storage = multer.diskStorage({
	destination: './uploads',
	filename: (req, file, cb) => {
		cb(null, `${Date.now()}-${file.originalname}`);
	},
});

const allowedMimetypes = [
	'image/jpeg',
	'image/png',
	'image/webp',
	'application/pdf',
];

const fileFilter = (req, file, cb) => {
	if (!allowedMimetypes.includes(file.mimetype)) {
		return cb(new Error('INVALID_FILE_TYPE'));
	}

	return cb(null, true);
};

const upload = multer({
	storage,
	fileFilter,
	limits: {
		fileSize: 10 * 1024 * 1024,
	},
});

module.exports = upload;
