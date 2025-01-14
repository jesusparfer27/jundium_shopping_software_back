import { connectDB } from '../data/mongodb.js';
import { Product } from '../data/mongodb.js';
import mongoose from 'mongoose';

// Conectar a la base de datos
connectDB();

// Obtener producto por ID
export const getProductById = async (req, res) => {
    try {
        const { id } = req.params; // Obtener el id desde los parámetros de la ruta
        console.log('ID del producto recibido:', id); // Para depuración

        // Verificar si el ID es válido
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID de producto inválido' });
        }

        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }

        return res.json(product);
    } catch (e) {
        console.error(e); // Para depuración
        res.status(500).json({ message: e.message });
    }
};

// Obtener todos los productos con filtros
export const getProducts = async (req, res) => {
    try {
        const { search, type, color, size, discount, product_code, gender, collection, price } = req.query;
        const filters = {};

        // Filtrado por nombre
        if (search) {
            const searchTerm = search.replace(/%20/g, ' '); // Decodificar espacios
            filters['variants.name'] = { $regex: searchTerm, $options: 'i' }; // Búsqueda insensible a mayúsculas
        }

        // Filtrado por otros parámetros
        if (type) filters.type = type;
        if (color) filters['variants.color.colorName'] = color;
        if (size) filters['variants.sizes.size'] = size;
        if (discount) filters.discount = { $gt: discount };
        if (product_code) filters.product_code = product_code;
        if (gender) filters.gender = gender;
        if (collection) filters.collection = collection;

        // Filtrado por precio
        if (price) {
            const priceRange = price.split('-');
            if (priceRange.length === 2) {
                const minPrice = parseFloat(priceRange[0]);
                const maxPrice = parseFloat(priceRange[1]);
                filters.price = { $gte: minPrice, $lte: maxPrice };
            } else {
                const price = parseFloat(price);
                filters.price = price;
            }
        }

        // Buscar los productos con los filtros
        const products = await Product.find(filters).populate('variants');
        res.json(products);
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: e.message });
    }
};


export const getProductByReferenceOrCode = async (req, res, next) => {
    const { product_reference, product_code } = req.query;

    console.log("Referencia recibida:", { product_reference, product_code });

    try {
        let product;

        if (product_reference) {
            // Busca el producto por referencia directamente
            product = await Product.findOne({ product_reference });
        } else if (product_code) {
            // Busca el producto por el código en las variantes
            product = await Product.findOne({
                variants: { $elemMatch: { product_code } },
            });
        }

        if (!product) {
            return res.status(404).json({ message: "Producto no encontrado" });
        }

        console.log("Producto encontrado:", product);

        // Si se buscó por product_code, devuelve solo la variante correspondiente
        if (product_code) {
            const filteredVariant = product.variants.find(
                (variant) => variant.product_code === product_code
            );

            if (!filteredVariant) {
                return res
                    .status(404)
                    .json({ message: "Variante no encontrada con el código proporcionado" });
            }

            return res.json({ product, variant: filteredVariant });
        }

        // Si se buscó por product_reference, devuelve todo el producto
        return res.json(product);
    } catch (error) {
        console.error("Error en la búsqueda de producto:", error);
        next(error);
    }
};

export const filterByName = async (req, res) => {
    try {
        const search = req.params.name.replace(/%20/g, ' ') || ''; // Decodificar el nombre con espacios
        const query = search
            ? { 'variants.name': { $regex: search, $options: 'i' } } // Insensible a mayúsculas
            : {}; // Si no se pasa nombre, devuelve todos los productos

        const products = await Product.find(query).populate('variants');
        res.json(products);
    } catch (error) {
        res.status(500).json({
            message: 'Error al obtener los productos',
            error: error.message,
        });
    }
};


