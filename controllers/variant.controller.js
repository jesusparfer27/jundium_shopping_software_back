// controllers/variant.controller.js
import { Product } from '../data/mongodb.js';
import mongoose from 'mongoose';

export const uploadImagesToProduct = (req, res) => {
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

export const addVariant = async (req, res) => {
    try {
      // Asegúrate de que se envíen datos JSON y que el cuerpo esté correctamente estructurado
      if (!req.body.formData) {
        return res.status(400).json({ message: "formData no está presente en la solicitud." });
      }
  
      const variantData = JSON.parse(req.body.formData || "{}");
      console.log(variantData); // Puedes revisar en consola si se reciben correctamente los datos
      
      // Verificar que la variante tenga los datos necesarios
      if (!variantData.color || !variantData.price || !variantData.sizes) {
        return res.status(400).json({ message: "Faltan datos esenciales de la variante." });
      }
  
      const product = await Product.findOne({ product_reference: req.params.productReference });
  
      if (!product) {
        return res.status(404).json({ message: "Producto no encontrado." });
      }
  
      let productCode;
      let isUnique = false;
  
      // Generar un código único para la variante
      while (!isUnique) {
        productCode = generateProductCode();
        const existingProduct = await Product.findOne({ 'variants.product_code': productCode });
  
        if (!existingProduct) {
          isUnique = true;
        }
      }
  
      const variantId = new mongoose.Types.ObjectId();
  
      const newVariant = {
        ...variantData,
        variant_id: variantId,
        product_code: productCode,
      };
  
      product.variants.push(newVariant);
      await product.save();
  
      res.status(201).json({ message: "Variante agregada con éxito.", newVariant });
    } catch (error) {
      console.error("Error al agregar la variante:", error);
      res.status(500).json({ message: "Error al agregar la variante." });
    }
  };
  