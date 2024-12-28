// controllers/variant.controller.js
import { Product } from '../data/mongodb.js';
import mongoose from 'mongoose';

export const addVariantToProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        const { variant } = req.body;

        if (!variant || !variant.product_code || !variant.name || !variant.size || !variant.price) {
            return res.status(400).json({ message: "Faltan datos requeridos para la variante." });
        }

        // Buscar el producto existente
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ message: "Producto no encontrado." });
        }

        // Crear una nueva variante
        const variantId = new mongoose.Types.ObjectId();
        const newVariant = {
            ...variant,
            variant_id: variantId,
        };

        // Añadir la variante al producto
        product.variants.push(newVariant);
        await product.save();

        res.status(201).json({ message: "Variante agregada correctamente.", product });
    } catch (error) {
        console.error("Error al agregar variante:", error);
        res.status(500).json({ message: "Error al agregar variante." });
    }
};
