import { Product } from '../data/mongodb.js';
import mongoose from 'mongoose';

// Función para editar un producto
export const editProduct = async (req, res) => {
    try {
        const { productReference } = req.params;
        const updateData = req.body; // Datos del cuerpo de la solicitud

        // Buscar el producto por referencia
        const product = await Product.findOne({ product_reference: productReference });

        if (!product) {
            return res.status(404).json({ message: "Producto no encontrado." });
        }

        // Actualizar propiedades del producto solo si existen en el modelo
        Object.keys(updateData).forEach((key) => {
            if (key in product) {
                product[key] = updateData[key];
            }
        });

        // Guardar los cambios
        await product.save();

        res.status(200).json({ message: "Producto actualizado correctamente.", product });
    } catch (error) {
        console.error("Error al actualizar el producto:", error);
        res.status(500).json({ message: "Error al actualizar el producto." });
    }
};

export const editVariant = async (req, res) => {
    const { productCode } = req.params; // Captura el `productCode` de la URL
    console.log("productCode recibido:", productCode);

    try {
        const { variants } = req.body; // Extraemos las variantes desde el body
        console.log("Datos recibidos (variants):", variants);

        if (!variants || !Array.isArray(variants) || variants.length === 0) {
            return res.status(400).json({ error: "El cuerpo de la solicitud es inválido o no contiene variantes." });
        }

        // Buscar el producto que contiene las variantes
        const product = await Product.findOne({ "variants.product_code": productCode });
        console.log("Producto encontrado:", product);

        if (!product) {
            return res.status(404).json({ message: "Producto no encontrado." });
        }

        // Actualizar cada variante según el `productCode`
        variants.forEach((updatedVariant) => {
            const variantIndex = product.variants.findIndex(variant => variant.product_code === updatedVariant.product_code);
            console.log(`Índice de la variante con código ${updatedVariant.product_code}:`, variantIndex);

            if (variantIndex === -1) {
                console.log(`Variante con código ${updatedVariant.product_code} no encontrada en el producto.`);
                return;
            }

            console.log("Variante antes de actualizar:", product.variants[variantIndex]);

            // Actualizar solo los campos enviados en el payload
            Object.keys(updatedVariant).forEach((key) => {
                product.variants[variantIndex][key] = updatedVariant[key];
            });

            console.log("Variante después de actualizar:", product.variants[variantIndex]);

            // Marcar el campo `variants` como modificado
            product.markModified(`variants.${variantIndex}`);
        });

        // Guardar los cambios en el producto
        await product.save();

        res.status(200).json({ message: "Variantes actualizadas correctamente.", product });
    } catch (error) {
        console.error("Error al actualizar las variantes:", error);
        res.status(500).json({ message: "Error al actualizar las variantes." });
    }
};