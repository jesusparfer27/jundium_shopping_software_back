import { connectDB } from '../data/mongodb.js';
import { Wishlist, Product } from '../data/mongodb.js';

connectDB();

// Controlador para añadir un producto a la wishlist
export const addToWishlist = async (req, res) => {
    const { product_id, variant_id } = req.body; // Datos enviados desde el cliente
    const user_id = req.user.id; // ID del usuario autenticado

    // Logs para depurar el cuerpo de la solicitud y el usuario
    console.log("Cuerpo de la solicitud en el backend:", req.body);
    console.log("El usuario autenticado:", user_id);

    // Validación inicial de los datos necesarios
    if (!user_id || !product_id || !variant_id) {
        return res.status(400).json({ message: 'user_id, product_id y variant_id son requeridos.' });
    }

    try {
        // Verificar si el producto existe
        const product = await Product.findById(product_id);
        if (!product) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }

        // Buscar la variante dentro del producto
        const variant = product.variants.find(v => v.variant_id.toString() === variant_id);
        if (!variant) {
            return res.status(404).json({ message: 'Variante no encontrada' });
        }

        // Verificar si el usuario ya tiene una wishlist
        let wishlist = await Wishlist.findOne({ user_id });
        if (!wishlist) {
            // Si no existe, crear una nueva wishlist
            wishlist = new Wishlist({ user_id, items: [] });
        }

        // Verificar si el producto y variante ya están en la wishlist
        const existingItemIndex = wishlist.items.findIndex(item => 
            item.product_id.toString() === product_id.toString() && 
            item.variant_id.toString() === variant_id.toString()
        );

        if (existingItemIndex > -1) {
            // Si ya está en la wishlist, devolver un mensaje
            return res.status(400).json({ message: 'El producto ya está en la wishlist' });
        } else {
            // Si no está, añadirlo a la lista de items
            wishlist.items.push({
                product_id,
                variant_id,
                name: product.name,
                price: variant.price,
                color: variant.color.colorName,
                image: variant.image[0], // Primera imagen de la variante
            });
        }

        // Guardar la wishlist actualizada
        await wishlist.save();
        return res.status(200).json({ message: 'Producto agregado a la wishlist correctamente.', wishlist });
    } catch (error) {
        // Manejo de errores
        console.error('Error añadiendo a la wishlist: ', error);
        return res.status(500).json({ message: 'Error añadiendo a la wishlist: ' + error.message });
    }
};

// Controlador para obtener la wishlist del usuario autenticado
export const getWishlist = async (req, res) => {
    const user_id = req.user.id; // ID del usuario autenticado

    try {
        // Buscar la wishlist del usuario y popular referencias
        const wishlist = await Wishlist.findOne({ user_id }).populate('items.product_id items.variant_id');
        if (!wishlist) {
            return res.status(404).json({ message: "Wishlist no encontrada" });
        }
        return res.status(200).json(wishlist);
    } catch (error) {
        // Manejo de errores
        console.error('Error al obtener la wishlist:', error);
        return res.status(500).json({ message: "Error al obtener la wishlist" });
    }
};

// Controlador para eliminar un producto de la wishlist
export const removeFromWishlist = async (req, res) => {
    const { product_id, variant_id } = req.body; // Datos enviados desde el cliente
    const user_id = req.user.id; // ID del usuario autenticado

    try {
        // Validar que los datos requeridos estén presentes
        if (!product_id || !variant_id) {
            return res.status(400).json({ message: 'Producto o variante no proporcionados' });
        }

        // Buscar la wishlist del usuario
        const wishlist = await Wishlist.findOne({ user_id });
        if (!wishlist) {
            return res.status(404).json({ message: 'Wishlist no encontrada' });
        }

        // Buscar el índice del producto en la lista de items
        const itemIndex = wishlist.items.findIndex(
            (item) => item.product_id.toString() === product_id && item.variant_id.toString() === variant_id
        );

        if (itemIndex === -1) {
            // Si no se encuentra, devolver un mensaje
            return res.status(404).json({ message: 'Producto no encontrado en la wishlist' });
        }

        // Eliminar el producto de la lista
        wishlist.items.splice(itemIndex, 1);
        await wishlist.save();

        return res.status(200).json({ message: 'Producto eliminado de la wishlist', wishlist });
    } catch (error) {
        // Manejo de errores
        console.error('Error eliminando de la wishlist:', error);
        return res.status(500).json({ message: 'Error eliminando de la wishlist', error: error.message });
    }
};

// Controlador para crear una nueva wishlist para un usuario
export const createWishlist = async (req, res) => {
    const user_id = req.user.id; // ID del usuario autenticado

    try {
        // Verificar si el usuario ya tiene una wishlist
        let wishlist = await Wishlist.findOne({ user_id });
        if (wishlist) {
            return res.status(400).json({ message: 'El usuario ya tiene una wishlist' });
        }

        // Crear una nueva wishlist vacía
        wishlist = new Wishlist({ user_id, items: [] });
        await wishlist.save();

        res.status(201).json(wishlist);
    } catch (error) {
        // Manejo de errores
        console.error('Error al crear la wishlist:', error);
        res.status(500).json({ message: 'Error del servidor al crear la wishlist' });
    }
};


