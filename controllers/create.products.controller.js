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
        
            // Generar un ID único para variant_id
            const variantId = new mongoose.Types.ObjectId();
        
            return {
                ...variant,
                variant_id: variantId, // Asignar el nuevo ID único
                product_code: productCode,
                sizes: variant.sizes || [],
            };
        }));

        const product = new Product({
            ...generalProduct,
            variants: updatedVariants,
            // images: req.files ? req.files.map(file => file.path) : [],
        });

        await product.save();

        res.status(201).json({ message: "Producto creado con éxito.", product });
    } catch (error) {
        console.error("Error al crear el producto:", error);
        res.status(500).json({ message: "Error al crear el producto." });
    }
};


// export const createProduct = async (req, res) => {
//     try {
//         const generalProduct = JSON.parse(req.body.generalProduct || "{}");
//         const variants = JSON.parse(req.body.variants || "[]");

//         if (!generalProduct || !variants.length) {
//             return res.status(400).json({ message: "Faltan datos requeridos." });
//         }

//         console.log("Datos recibidos:", generalProduct, variants);

//         res.status(201).json({ message: "Producto creado con éxito." });
//     } catch (error) {
//         console.error("Error al crear el producto:", error);
//         res.status(500).json({ message: "Error al crear el producto." });
//     }
// };

