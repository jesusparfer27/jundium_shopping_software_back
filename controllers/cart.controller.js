import { connectDB } from '../data/mongodb.js';
import { Cart, Product } from '../data/mongodb.js';

connectDB();

export const addToCart = async (req, res) => {
    const { user_id, product_id, variant_id, quantity, colorName, size, price } = req.body;

    console.log("Valores recibidos:", { user_id, product_id, variant_id, quantity, colorName, size, price });

    try {
        if (!user_id || !product_id || !variant_id || !quantity || !size || !price) {
            return res.status(400).json({ message: "Todos los campos son requeridos." });
        }

        const product = await Product.findById(product_id);
        if (!product) {
            return res.status(404).json({ message: "Producto no encontrado." });
        }

        console.log("Precio del producto:", price);

        let cart = await Cart.findOne({ user_id });

        if (cart) {
            const existingCartItemIndex = cart.items.findIndex(
                (item) =>
                    item.product_id.toString() === product_id &&
                    item.variant_id.toString() === variant_id &&
                    item.size === size 
            );

            if (existingCartItemIndex !== -1) {
                cart.items[existingCartItemIndex].quantity += quantity;
            } else {
                cart.items.push({
                    product_id,
                    variant_id,
                    quantity,
                    colorName,
                    size,
                    price,
                });
            }
        } else {
            cart = new Cart({
                user_id,
                items: [
                    {
                        product_id,
                        variant_id,
                        quantity,
                        colorName,
                        size,
                        price,
                    },
                ],
            });
        }

        cart.total_price = cart.items.reduce(
            (total, item) => total + item.price * item.quantity,
            0
        );

        await cart.save();

        return res.status(200).json({
            message: cart.items.length === 1 ? "Carrito creado y producto agregado." : "Producto añadido al carrito.",
            cartItem: cart.items,
            total_price: cart.total_price,
        });
    } catch (error) {
        console.error("Error al añadir al carrito:", error);
        return res.status(500).json({ message: "Error interno del servidor." });
    }
};
  
  
export const removeFromCart = async (req, res) => {
    const { productId, variantId } = req.params; 
    const userId = req.user.id;

    try {
        const cart = await Cart.findOne({ user_id: userId });
        if (!cart) {
            return res.status(404).json({ message: 'Carrito no encontrado' });
        }

        const itemIndex = cart.items.findIndex(
            item => item.product_id.toString() === productId && item.variant_id.toString() === variantId
        );
        

        if (itemIndex === -1) {
            return res.status(404).json({ message: 'Producto no encontrado en el carrito' });
        }

        if (cart.items[itemIndex].quantity > 1) {
            cart.items[itemIndex].quantity -= 1;
        } else {
            
            cart.items.splice(itemIndex, 1);
        }

        await cart.save();
        return res.status(200).json({ message: 'Producto actualizado en el carrito', cart });
    } catch (error) {
        console.error('Error eliminando del carrito:', error);
        return res.status(500).json({ message: 'Error eliminando del carrito', error });
    }
};


export const updateCartItem = async (req, res) => {
    const { productId, variantId, quantity } = req.body;
    const userId = req.user.id;

    try {
        const cart = await Cart.findOne({ user_id: userId });
        if (!cart) {
            return res.status(404).json({ message: 'Carrito no encontrado' });
        }

        const cartItem = cart.items.find(item => 
            item.product_id.toString() === productId && item.variant_id.toString() === variantId
        );

        if (!cartItem) {
            return res.status(404).json({ message: 'Producto no encontrado en el carrito' });
        }

        cartItem.quantity = quantity;

        await cart.save();
        return res.status(200).json({ message: 'Cantidad actualizada', cart });
    } catch (error) {
        console.error('Error actualizando el carrito:', error);
        return res.status(500).json({ message: 'Error actualizando el carrito', error });
    }
};

export const getCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ user_id: req.user.id }).populate('items.product_id items.variant_id');
        if (!cart) {
            return res.status(404).json({ message: "Carrito no encontrado" });
        }
        return res.status(200).json(cart);
    } catch (error) {
        console.error('Error al obtener el carrito:', error);
        return res.status(500).json({ message: "Error al obtener el carrito" });
    }
};

export const updateCartQuantity = async (req, res) => {
    const { productId, variantId, quantity } = req.body;
    const userId = req.user.id; // Obtener el ID del usuario autenticado

    try {
        const cartItem = await Cart.findOneAndUpdate(
            { userId, 'items.product_id': productId, 'items.variant_id': variantId },
            { $set: { 'items.$.quantity': quantity } },
            { new: true }
        );

        if (!cartItem) {
            return res.status(404).json({ message: 'Producto no encontrado en el carrito.' });
        }

        res.json(cartItem);
    } catch (error) {
        console.error('Error al actualizar la cantidad del carrito:', error);
        res.status(500).json({ message: 'Error al actualizar la cantidad del carrito.' });
    }
};
