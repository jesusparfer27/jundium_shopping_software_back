import { Product } from '../data/mongodb.js';
import mongoose from 'mongoose';

// Controlador para subir imágenes relacionadas con un producto
export const uploadImagesToProduct = (req, res) => {
    try {
        // Depuración: Mostrar contenido de la solicitud y los archivos recibidos
        console.log('Contenido de la solicitud:', req.body);
        console.log('Archivos recibidos:', req.files);

        // Verificar si se han recibido archivos
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No se han subido imágenes.' });
        }

        // Responder con éxito incluyendo las rutas de las imágenes subidas
        res.status(200).json({
            message: 'Imágenes subidas correctamente.',
            imagePaths: req.files.map(f => f.path),
        });
    } catch (err) {
        // Manejo de errores en caso de fallo al subir imágenes
        console.error('Error al subir imágenes:', err);
        res.status(500).json({ error: 'Error al subir imágenes.' });
    }
};

export const addVariant = async (req, res) => {
    try {
        console.log("Cuerpo recibido:", req.body); // Depuración

        // Validar si el campo `variants` está presente en el cuerpo de la solicitud
        const variantsString = req.body.variants;
        if (!variantsString) {
            return res.status(400).json({ message: "El campo 'variants' no está presente en la solicitud." });
        }

        // Parsear el JSON del campo `variants`
        let variants;
        try {
            variants = JSON.parse(variantsString);
        } catch (error) {
            return res.status(400).json({ message: "Error al parsear el campo 'variants'.", error });
        }

        // Asegurarse de que `variants` es un array y contiene al menos una variante
        if (!Array.isArray(variants) || variants.length === 0) {
            return res.status(400).json({ message: "El campo 'variants' debe ser un array no vacío." });
        }

        // Buscar el producto relacionado por `product_reference`
        const product = await Product.findOne({ product_reference: req.params.productReference });
        if (!product) {
            return res.status(404).json({ message: "Producto no encontrado." });
        }

        // Agregar cada variante al producto
        for (const variantData of variants) {
            if (!variantData.color || !variantData.price || !variantData.sizes) {
                return res.status(400).json({ message: "Faltan datos esenciales de una variante." });
            }

            // Asegúrate de que 'originalPrice' esté incluido en variantData
            if (!variantData.originalPrice) {
                return res.status(400).json({ message: "El campo 'originalPrice' es obligatorio para cada variante." });
            }

            // Generar un código único para la variante
            const productCode = await generateUniqueProductCode();

            // Crear el ID único para la variante
            const variantId = new mongoose.Types.ObjectId();

            // Crear la nueva variante
            const newVariant = {
                ...variantData,
                variant_id: variantId,
                product_code: productCode,
            };

            // Añadir la variante al producto
            product.variants.push(newVariant);
        }

        // Guardar el producto actualizado en la base de datos
        await product.save();

        // Responder con éxito
        res.status(201).json({ message: "Variantes agregadas con éxito.", variants: product.variants });
    } catch (error) {
        console.error("Error al agregar la variante:", error);
        res.status(500).json({ message: "Error al agregar la variante." });
    }
};


// Función para generar un código único de producto
const generateUniqueProductCode = async () => {
    let productCode;
    let isUnique = false;

    while (!isUnique) {
        // Generar un código de producto aleatorio
        productCode = generateProductCode();
        // Verificar si el código ya existe en la base de datos
        const existingProduct = await Product.findOne({ 'variants.product_code': productCode });
        isUnique = !existingProduct;
    }

    return productCode;
};

// Función para generar un código alfanumérico
const generateProductCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 10; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return `PROD-${code}`;
};
