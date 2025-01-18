import { connectDB } from '../data/mongodb.js'; // Importa la función para conectar a la base de datos
import { Order } from '../data/mongodb.js'; // Importa el modelo Order
import mongoose from 'mongoose'; // Biblioteca para manejar MongoDB y sus esquemas
import { authenticateToken } from '../middlewares/auth.js'; // Middleware para autenticar usuarios
import { Product } from '../data/mongodb.js'; // Importa el modelo Product
import crypto from 'crypto'; // Biblioteca para generar códigos únicos

connectDB();

// Genera un código único para los pedidos
export const generateOrderCode = () => {
    return crypto.randomBytes(6).toString('hex').toUpperCase(); // Genera un código aleatorio de 6 bytes en formato hexadecimal
};

// Crear un nuevo pedido
export const createOrder = async (req, res, next) => {
    const session = await mongoose.startSession(); // Inicia una sesión para realizar operaciones en una transacción
    session.startTransaction(); // Inicia la transacción
    try {
        // Extraer datos del cuerpo de la solicitud
        const { user_id, items, total, status } = req.body;

        // Validar que el ID de usuario sea válido
        if (!user_id || !mongoose.Types.ObjectId.isValid(user_id)) {
            return res.status(400).json({ message: 'ID de usuario no válido o no proporcionado.' });
        }

        // Validar que existan artículos en el pedido
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: 'Debe proporcionar al menos un artículo en el pedido.' });
        }

        // Validar que el total sea un número positivo
        if (!total || typeof total !== 'number' || total <= 0) {
            return res.status(400).json({ message: 'El total debe ser un número positivo.' });
        }

        // Validación y reducción del stock de los productos en el pedido
        for (const item of items) {
            const { product_id, variant_id, quantity, size } = item;

            // Buscar el producto y la variante específica
            const product = await Product.findOne(
                { _id: product_id, 'variants.variant_id': variant_id },
                { 'variants.$': 1 } // Selecciona solo la variante que coincide
            ).session(session);

            // Verificar que el producto y la variante existan
            if (!product) {
                throw new Error(`Producto con ID ${product_id} o variante ${variant_id} no encontrado.`);
            }

            const variant = product.variants[0]; // Accede a la variante seleccionada
            const sizeIndex = variant.sizes.findIndex((s) => s.size === size); // Encuentra el índice del tamaño

            // Verificar que el tamaño exista en la variante
            if (sizeIndex === -1) {
                throw new Error(`Tamaño ${size} no encontrado para la variante ${variant_id}.`);
            }

            // Verificar que haya stock suficiente
            if (variant.sizes[sizeIndex].stock < quantity) {
                throw new Error(`Stock insuficiente para el tamaño ${size} del producto ${product_id}.`);
            }

            // Actualizar el stock y marcar si está agotado
            await Product.updateOne(
                { _id: product_id, 'variants.variant_id': variant_id },
                {
                    $inc: { [`variants.$.sizes.${sizeIndex}.stock`]: -quantity }, // Reducir el stock
                    $set: { [`variants.$.sizes.${sizeIndex}.out_of_stock`]: variant.sizes[sizeIndex].stock - quantity <= 0 } // Marcar agotado si el stock es 0
                },
                { session }
            );
        }

        // Crear el pedido en la base de datos
        const newOrder = await Order.create(
            [
                {
                    user_id,
                    orderCode: generateOrderCode(), // Generar un código único
                    total,
                    status: status || 'Pending', // Estado predeterminado: Pending
                    items,
                }
            ],
            { session }
        );

        await session.commitTransaction(); // Confirmar la transacción
        session.endSession(); // Finalizar la sesión

        res.status(201).json({
            message: 'Pedido creado exitosamente.',
            order: newOrder,
        });
    } catch (error) {
        await session.abortTransaction(); // Revertir los cambios si ocurre un error
        session.endSession(); // Finalizar la sesión
        console.error('Error al crear el pedido:', error);
        next(error); // Pasar el error al middleware de manejo de errores
    }
};

// Obtener pedidos de un usuario autenticado
export const getOrders = async (req, res, next) => {
    try {
        const userId = req.user.id; // Obtener el ID del usuario desde el token autenticado

        // Validar que el ID del usuario sea válido
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'ID de usuario no válido.' });
        }

        // Buscar pedidos asociados al usuario
        const orders = await Order.find({ user_id: userId })
            .populate('items.product_id', 'name') // Poblar con el nombre del producto
            .populate('items.variant_id', 'size colorName') // Poblar con información de variantes
            .exec();

        res.status(200).json(orders); // Responder con los pedidos encontrados
    } catch (error) {
        console.error('Error obteniendo los pedidos:', error);
        next(error); // Pasar el error al middleware de manejo de errores
    }
};

// Actualizar el estado de un pedido
export const updateOrderStatus = async (req, res, next) => {
    try {
        const { orderId, status } = req.body; // Obtener el ID del pedido y el nuevo estado

        // Validar que el ID del pedido sea válido
        if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({ message: 'ID de pedido no válido o no proporcionado.' });
        }

        // Validar que el estado proporcionado sea válido
        if (!status || !['Pending', 'Delivered', 'Cancelled', 'Shipped'].includes(status)) {
            return res.status(400).json({ message: 'Estado del pedido no válido.' });
        }

        // Buscar el pedido en la base de datos
        const order = await Order.findById(orderId);

        // Verificar que el pedido exista
        if (!order) {
            return res.status(404).json({ message: 'Pedido no encontrado.' });
        }

        // Actualizar el estado del pedido
        order.status = status;
        await order.save(); // Guardar los cambios

        res.status(200).json({
            message: 'Estado del pedido actualizado exitosamente.',
            order,
        });
    } catch (error) {
        console.error('Error actualizando el estado del pedido:', error);
        next(error); // Pasar el error al middleware de manejo de errores
    }
};