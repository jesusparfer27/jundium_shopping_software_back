import multer from 'multer';
import path from 'path';
import fs from 'fs';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const imageFolders = JSON.parse(req.body.imageFolders || "[]");
        const folderPath = imageFolders.length > 0 ? imageFolders[0] : 'default';

        const uploadPath = path.join(process.cwd(), 'public', 'images', folderPath);
        console.log('Upload Path:', uploadPath);

        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
            console.log(`Carpeta creada: ${uploadPath}`);
        }

        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const uploadDir = path.resolve(process.cwd(), 'public', 'images');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log("Directorio './public/images' creado");
}

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
});

export { upload };
