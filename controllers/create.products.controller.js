import { Product } from '../data/mongodb.js';
// import { upload } from '../middlewares/multer.js';
import { connectDB } from '../data/mongodb.js';
import mongoose from 'mongoose';

connectDB();

function generateProductCode() {
    return `PROD-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
}

export const createProduct = async (req, res) => {
    try {
        const generalProduct = JSON.parse(req.body.generalProduct || "{}");
        const variants = JSON.parse(req.body.variants || "[]");

        if (!generalProduct.collection || !generalProduct.brand || !generalProduct.type || !generalProduct.gender) {
            return res.status(400).json({ message: "Faltan datos requeridos." });
        }

        if (!Array.isArray(variants) || variants.length === 0) {
            return res.status(400).json({ message: "Debe incluir al menos una variante." });
        }

        const updatedVariants = await Promise.all(variants.map(async (variant) => {
            let productCode;
            let isUnique = false;

            while (!isUnique) {
                productCode = generateProductCode();
                const existingProduct = await Product.findOne({ 'variants.product_code': productCode });

                if (!existingProduct) {
                    isUnique = true;
                }
            }

            const variantId = new mongoose.Types.ObjectId();

            return {
                ...variant,
                variant_id: variantId,
                product_code: productCode,
                sizes: variant.sizes || [],
            };
        }));

        const product = new Product({
            ...generalProduct,
            variants: updatedVariants,
            images: req.files ? req.files.map(file => file.path) : [],
        });

        await product.save();

        res.status(201).json({ message: "Producto creado con éxito.", product });
    } catch (error) {
        console.error("Error al crear el producto:", error);
        res.status(500).json({ message: "Error al crear el producto." });
    }
};

export const uploadImages = (req, res) => {
    try {
        console.log('Contenido de la solicitud:', req.body);
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
};


