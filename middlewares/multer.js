import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const app = express();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const { generalProduct, variants } = req.body;
        const gender = generalProduct.gender;
        const type = generalProduct.type;
        const variant = variants ? variants[0] : {};
        const colorName = variant.colorName ? variant.color.colorName : 'unknownColor';
        const name = variant.name || 'unknownProduct';

        const folderPath = path.join(__dirname, `../public/images/${gender}/${type}/${name}/${colorName}`);
        fs.mkdirSync(folderPath, { recursive: true });
        cb(null, folderPath);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});

export const upload = multer({ storage });

app.post('/upload-images', upload.array('image'), (req, res) => {
    try {
        console.log('Archivos recibidos:', req.files);
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No se han subido imágenes.' });
        }
        res.status(200).json({
            message: 'Imágenes subidas correctamente.',
            imagePaths: req.files.map(f => f.path),
        });
    } catch (err) {
        console.error('Error al subir imágenes:', err);
        res.status(500).json({ error: 'Error al subir imágenes.' });
    }
});
