import multer from 'multer';
import path from 'path';
import fs from 'fs';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {

        console.log("Contenido de req.body:", JSON.stringify(req.body, null, 2));


        const imageFolders = req.body.imageFolders ? JSON.parse(req.body.imageFolders) : [];
        console.log('Ruta recibida para imágenes:', imageFolders);

        const folderPath = imageFolders.length > 0 ? imageFolders.join('/') : '';
        const uploadPath = path.join(process.cwd(), 'public', 'images', folderPath);

        console.log('Ruta final para almacenamiento:', uploadPath);

        if (!fs.existsSync(uploadPath) && folderPath) {
            fs.mkdirSync(uploadPath, { recursive: true });
            console.log(`Carpeta creada: ${uploadPath}`);
        } else {
            console.log(`La carpeta ${uploadPath} ya existe.`);
        }

        cb(null, uploadPath);
    }
    ,
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const uploadDir = path.resolve(process.cwd(), 'public', 'images');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log("Directorio './public/images' creado");
}

const uploadToProduct = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
});

export { uploadToProduct };
