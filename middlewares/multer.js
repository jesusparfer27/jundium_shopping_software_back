import multer from 'multer';
import path from 'path';
import fs from 'fs';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Verifica el contenido de req.body
        console.log('Contenido de req.body:', req.body);  // Asegúrate de que req.body contiene la información esperada

        // Aquí obtenemos el valor de la carpeta desde req.body (si está presente)
        const imageFolders = req.body.imageFolders ? JSON.parse(req.body.imageFolders) : []; // Parseamos correctamente si está presente
        console.log('Ruta recibida para imágenes:', imageFolders);

        // Si la ruta de las carpetas está vacía, usamos la ruta base sin subcarpetas
        const folderPath = imageFolders.length > 0 ? imageFolders.join('/') : '';  // Evita usar 'default'
        const uploadPath = path.join(process.cwd(), 'public', 'images', folderPath);  // Usamos la ruta generada

        console.log('Ruta final para almacenamiento:', uploadPath); // Verifica la ruta

        // Verificar si la carpeta existe, si no la creamos
        if (!fs.existsSync(uploadPath) && folderPath) {
            fs.mkdirSync(uploadPath, { recursive: true });
            console.log(`Carpeta creada: ${uploadPath}`);
        } else {
            console.log(`La carpeta ${uploadPath} ya existe.`);
        }

        // Pasa la ruta calculada a Multer
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

// Crear el directorio base si no existe
const uploadDir = path.resolve(process.cwd(), 'public', 'images');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log("Directorio './public/images' creado");
}

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // Limitar tamaño del archivo
});

export { upload };
