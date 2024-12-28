import { Product } from '../data/mongodb.js';
import mongoose from 'mongoose';

// Función para editar un producto
export const editProduct = async (req, res) => {
    try {
        const { productReference } = req.params; // Usamos el product_reference
        const updateData = req.body; // Datos a actualizar en el producto

        // Buscar el producto por product_reference
        const product = await Product.findOne({ product_reference: productReference });

        if (!product) {
            return res.status(404).json({ message: "Producto no encontrado." });
        }

        // Actualizamos los datos del producto
        for (let key in updateData) {
            if (product[key] !== undefined) {
                product[key] = updateData[key];
            }
        }

        // Guardar los cambios
        await product.save();

        res.status(200).json({ message: "Producto actualizado correctamente.", product });
    } catch (error) {
        console.error("Error al actualizar el producto:", error);
        res.status(500).json({ message: "Error al actualizar el producto." });
    }
};

// Función para editar una variante de producto
export const editVariant = async (req, res) => {
    try {
        const { productReference, productCode } = req.params; // Usamos product_reference y product_code
        const updateData = req.body; // Datos a actualizar en la variante

        // Buscar el producto usando product_reference
        const product = await Product.findOne({ product_reference: productReference });

        if (!product) {
            return res.status(404).json({ message: "Producto no encontrado." });
        }

        // Buscar la variante dentro del producto usando el product_code
        const variantIndex = product.variants.findIndex(variant => variant.product_code === productCode);

        if (variantIndex === -1) {
            return res.status(404).json({ message: "Variante no encontrada." });
        }

        // Actualizamos los datos de la variante
        const variant = product.variants[variantIndex];

        for (let key in updateData) {
            if (variant[key] !== undefined) {
                variant[key] = updateData[key];
            }
        }

        // Guardar los cambios en el producto
        await product.save();

        res.status(200).json({ message: "Variante actualizada correctamente.", product });
    } catch (error) {
        console.error("Error al actualizar la variante:", error);
        res.status(500).json({ message: "Error al actualizar la variante." });
    }
};
