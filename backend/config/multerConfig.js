const multer = require("multer");
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../public/images');

        fs.mkdirSync(uploadDir, { recursive: true });

        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        console.log("This is  a test",req.body)
        let listingData = JSON.parse(req.body.listingData)
        const imageName = listingData.image
        const ext = path.extname(file.originalname);
        cb(null, `${imageName}`);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only allow image'), false);
    }
};


module.exports = multer({
    storage: storage,
    fileFilter: fileFilter
}).single('image');
