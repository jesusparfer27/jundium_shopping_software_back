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


// Obtener producto por referencia o código
export const getProductByReferenceOrCode = async (req, res, next) => {
    const { product_reference, product_code } = req.query; // Obtiene los parámetros de referencia o código
    console.log("Referencia recibida:", { product_reference, product_code }); // Registro para depuración

    try {
        let product;

        if (product_reference) {
            // Busca el producto por referencia
            product = await Product.findOne({ product_reference });
        } else if (product_code) {
            // Busca el producto por código en las variantes
            product = await Product.findOne({
                variants: { $elemMatch: { product_code } },
            });
        }

        if (!product) {
            return res.status(404).json({ message: "Producto no encontrado" }); // Producto no encontrado
        }

        console.log("Producto encontrado:", product);

        // Devuelve solo la variante correspondiente si se busca por código
        if (product_code) {
            const filteredVariant = product.variants.find(
                (variant) => variant.product_code === product_code
            );

            if (!filteredVariant) {
                return res
                    .status(404)
                    .json({ message: "Variante no encontrada con el código proporcionado" });
            }

            return res.json({ product, variant: filteredVariant }); // Devuelve producto y variante
        }

        return res.json(product); // Devuelve todo el producto si se busca por referencia
    } catch (error) {
        console.error("Error en la búsqueda de producto:", error); // Registro de error
        next(error); // Manejo de errores centralizado
    }
};

// Filtrar productos por nombre
export const filterByName = async (req, res) => {
    try {
        const search = req.params.name.replace(/%20/g, ' ') || ''; // Decodifica el nombre desde los parámetros
        const query = search
            ? { 'variants.name': { $regex: search, $options: 'i' } } // Filtro de búsqueda insensible a mayúsculas
            : {}; // Devuelve todos los productos si no hay búsqueda

        const products = await Product.find(query).populate('variants'); // Busca productos y popula variantes
        res.json(products);
    } catch (error) {
        res.status(500).json({
            message: 'Error al obtener los productos', // Mensaje de error
            error: error.message,
        });
    }
};


