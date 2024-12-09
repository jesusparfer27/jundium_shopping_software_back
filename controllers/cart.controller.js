import { connectDB } from '../data/mongodb.js';
import { Cart, Product } from '../data/mongodb.js';

// Conectar a la base de datos
connectDB();

export const addToCart = async (req, res) => {
  const { user_id, product_id, variant_id, quantity, colorName, size } = req.body;

  console.log("Valores recibidos:", { user_id, product_id, variant_id, quantity, colorName, size });

  try {
      if (!user_id || !product_id || !variant_id || !quantity || !size) {
          return res.status(400).json({ message: "Todos los campos son requeridos." });
      }

      // Verifica si el producto ya existe en el carrito del usuario con la misma variante y talla
      const existingCartItem = await Cart.findOne({
          user_id,
          product_id,
          variant_id,
          size, // Diferenciar por talla
      });

      if (existingCartItem) {
          // Si ya existe, incrementar la cantidad
          existingCartItem.quantity += quantity;
          await existingCartItem.save();
          return res.status(200).json({
              message: "Producto actualizado en el carrito.",
              cartItem: existingCartItem,
          });
      } else {
          // Si no existe, crear una nueva entrada en el carrito
          const newCartItem = new Cart({
              user_id,
              product_id,
              variant_id,
              colorName,
              size,
              quantity,
          });

          await newCartItem.save();
          return res.status(201).json({
              message: "Producto añadido al carrito.",
              cartItem: newCartItem,
          });
      }
  } catch (error) {
      console.error("Error al añadir al carrito:", error);
      return res.status(500).json({ message: "Error interno del servidor." });
  }
};
  
export const removeFromCart = async (req, res) => {
    const { productId, variantId } = req.params; // Cambié req.body a req.params
    const userId = req.user.id;

    try {
        const cart = await Cart.findOne({ user_id: userId });
        if (!cart) {
            return res.status(404).json({ message: 'Carrito no encontrado' });
        }

        // Encontrar el índice del producto en el carrito
        const itemIndex = cart.items.findIndex(
            item => item.product_id.toString() === productId && item.variant_id.toString() === variantId
        );
        

        if (itemIndex === -1) {
            return res.status(404).json({ message: 'Producto no encontrado en el carrito' });
        }

        // Reducir la cantidad del producto en uno
        if (cart.items[itemIndex].quantity > 1) {
            cart.items[itemIndex].quantity -= 1;
        } else {
            // Si la cantidad es 1, eliminar el producto del carrito
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