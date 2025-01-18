import { Product } from '../data/mongodb.js';
import mongoose from 'mongoose';

// Función para editar un producto existente
export const editProduct = async (req, res) => {
    try {
        const { productReference } = req.params; // Obtener la referencia del producto desde los parámetros de la URL
        const updateData = req.body; // Datos enviados en el cuerpo de la solicitud

        // Buscar el producto en la base de datos por su referencia única
        const product = await Product.findOne({ product_reference: productReference });

        if (!product) {
            // Si no se encuentra el producto, devolver un error 404
            return res.status(404).json({ message: "Producto no encontrado." });
        }

        // Actualizar solo las propiedades que existen en el modelo del producto
        Object.keys(updateData).forEach((key) => {
            if (key in product) {
                product[key] = updateData[key];
            }
        });

        // Guardar los cambios realizados en el producto
        await product.save();

        // Responder con un mensaje de éxito y los datos actualizados del producto
        res.status(200).json({ message: "Producto actualizado correctamente.", product });
    } catch (error) {
        // Manejar errores inesperados y devolver un error 500
        console.error("Error al actualizar el producto:", error);
        res.status(500).json({ message: "Error al actualizar el producto." });
    }
};

// Función para editar las variantes de un producto
export const editVariant = async (req, res) => {
    const { productCode } = req.params; // Obtener el código del producto desde los parámetros de la URL
    console.log("productCode recibido:", productCode);

    try {
        const { variants } = req.body; // Obtener las variantes desde el cuerpo de la solicitud
        console.log("Datos recibidos (variants):", variants);

        // Validar que las variantes existan y sean un array no vacío
        if (!variants || !Array.isArray(variants) || variants.length === 0) {
            return res.status(400).json({ error: "El cuerpo de la solicitud es inválido o no contiene variantes." });
        }

        // Buscar el producto que contiene la variante con el código proporcionado
        const product = await Product.findOne({ "variants.product_code": productCode });
        console.log("Producto encontrado:", product);

        if (!product) {
            // Si no se encuentra el producto, devolver un error 404
            return res.status(404).json({ message: "Producto no encontrado." });
        }

        // Iterar sobre las variantes recibidas para actualizarlas
        variants.forEach((updatedVariant) => {
            // Buscar el índice de la variante que coincide con el código proporcionado
            const variantIndex = product.variants.findIndex(variant => variant.product_code === updatedVariant.product_code);
            console.log(`Índice de la variante con código ${updatedVariant.product_code}:`, variantIndex);

            if (variantIndex === -1) {
                // Si la variante no existe, registrarlo en los logs y continuar
                console.log(`Variante con código ${updatedVariant.product_code} no encontrada en el producto.`);
                return;
            }

            console.log("Variante antes de actualizar:", product.variants[variantIndex]);

            // Actualizar solo los campos que se envían en la solicitud
            Object.keys(updatedVariant).forEach((key) => {
                product.variants[variantIndex][key] = updatedVariant[key];
            });

            console.log("Variante después de actualizar:", product.variants[variantIndex]);

            // Marcar la variante modificada para que Mongoose detecte el cambio
            product.markModified(`variants.${variantIndex}`);
        });

        // Guardar los cambios realizados en el producto
        await product.save();

        // Responder con un mensaje de éxito y el producto actualizado
        res.status(200).json({ message: "Variantes actualizadas correctamente.", product });
    } catch (error) {
        // Manejar errores inesperados y devolver un error 500
        console.error("Error al actualizar las variantes:", error);
        res.status(500).json({ message: "Error al actualizar las variantes." });
    }
};