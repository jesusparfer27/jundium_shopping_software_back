import { Product } from '../data/mongodb.js';
import { connectDB } from '../data/mongodb.js';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

connectDB();

// Esto es necesario para obtener __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Función para generar un código único de producto
function generateProductCode() {
    return `PROD-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
}

// Función para crear la carpeta si no existe
const createImageFolderIfNeeded = (folderPath) => {
    const fullPath = path.join(__dirname, '../public/images', folderPath); // Ruta completa
    if (!fs.existsSync(fullPath)) { // Verifica si la carpeta no existe
        fs.mkdirSync(fullPath, { recursive: true }); // Crea la carpeta
        console.log(`Carpeta creada: ${fullPath}`);
    }
};

// Función para crear un producto
export const createProduct = async (req, res) => {
    try {
        // Parsear los datos recibidos en la solicitud
        const generalProduct = JSON.parse(req.body.generalProduct || "{}");
        const variants = JSON.parse(req.body.variants || "[]");
        const imageFolders = JSON.parse(req.body.imageFolders || "[]");

        // Validaciones de campos requeridos
        if (!generalProduct.collection || !generalProduct.brand || !generalProduct.type || !generalProduct.gender || !generalProduct.product_reference) {
            return res.status(400).json({ message: "Faltan datos requeridos." });
        }

        if (!Array.isArray(variants) || variants.length === 0) {
            return res.status(400).json({ message: "Debe incluir al menos una variante." });
        }

        // Crear las carpetas para las imágenes
        imageFolders.forEach((folderPath) => {
            createImageFolderIfNeeded(folderPath);
        });

        // Asignar códigos únicos a las variantes
        const updatedVariants = await Promise.all(variants.map(async (variant) => {
            let productCode;
            let isUnique = false;

            // Generar código único hasta que no se repita
            while (!isUnique) {
                productCode = generateProductCode();
                const existingProduct = await Product.findOne({ 'variants.product_code': productCode });

                if (!existingProduct) {
                    isUnique = true;
                }
            }

            const variantId = new mongoose.Types.ObjectId(); // Crear ID único para la variante

            return {
                ...variant,
                variant_id: variantId,
                product_code: productCode,
                sizes: variant.sizes || [],
                showing_image: variant.showing_image || "", // Asegúrate de pasar el campo `showing_image` aquí
            };
        }));

        // Crear el producto con las variantes actualizadas
        const product = new Product({
            ...generalProduct,
            variants: updatedVariants,
        });

        // Guardar el producto en la base de datos
        await product.save();

        // Responder con éxito
        res.status(201).json({ message: "Producto creado con éxito.", product });
    } catch (error) {
        console.error("Error al crear el producto:", error);
        res.status(500).json({ message: "Error al crear el producto." });
    }
};

// Función para subir imágenes
export const uploadImages = (req, res) => {
    try {
        console.log('Contenido de la solicitud:', req.body);
        console.log('Archivos recibidos:', req.files);

        // Verificar que se hayan subido archivos
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No se han subido imágenes.' });
        }

        // Responder con las rutas de las imágenes subidas
        res.status(200).json({
            message: 'Imágenes subidas correctamente.',
            imagePaths: req.files.map(f => f.path), // Retornar las rutas de las imágenes
        });
    } catch (err) {
        console.error('Error al subir imágenes:', err);
        res.status(500).json({ error: 'Error al subir imágenes.' }); // Manejo de errores
    }
};
  