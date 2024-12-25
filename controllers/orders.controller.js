import { connectDB } from '../data/mongodb.js';
import { Order } from '../data/mongodb.js'; // Asegúrate de importar correctamente el modelo
import mongoose from 'mongoose';
import { authenticateToken } from '../middlewares/auth.js';
import crypto from 'crypto';

connectDB();

export const generateOrderCode = () => {
    return crypto.randomBytes(6).toString('hex').toUpperCase(); // Genera un código aleatorio único
};

export const createOrder = async (req, res, next) => {
    try {
        const { user_id, items, total, status } = req.body;

        // Log para inspeccionar los datos recibidos del frontend
        console.log('Datos recibidos en el controlador:', {
            user_id,
            items,
            total,
            status,
        });

        // Validación manual de campos requeridos
        if (!user_id || !mongoose.Types.ObjectId.isValid(user_id)) {
            return res.status(400).json({ message: 'ID de usuario no válido o no proporcionado.' });
        }

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: 'Debe proporcionar al menos un artículo en el pedido.' });
        }

        if (!total || typeof total !== 'number' || total <= 0) {
            return res.status(400).json({ message: 'El total debe ser un número positivo.' });
        }

        // Validación de cada artículo
        for (const item of items) {
            console.log('Validando artículo:', item);

            if (!item.product_id || !mongoose.Types.ObjectId.isValid(item.product_id)) {
                return res.status(400).json({ message: 'ID de producto no válido en uno de los artículos.' });
            }
            if (!item.variant_id || !mongoose.Types.ObjectId.isValid(item.variant_id)) {
                return res.status(400).json({ message: 'ID de variante no válido en uno de los artículos.' });
            }
            if (!item.quantity || typeof item.quantity !== 'number' || item.quantity <= 0) {
                return res.status(400).json({ message: 'La cantidad debe ser un número positivo.' });
            }
            if (!item.price || typeof item.price !== 'number' || item.price <= 0) {
                return res.status(400).json({ message: 'El precio debe ser un número positivo.' });
            }
            if (!item.colorName || typeof item.colorName !== 'string') {
                return res.status(400).json({ message: 'El nombre del color es obligatorio y debe ser una cadena.' });
            }
            if (!item.size || typeof item.size !== 'string') {
                return res.status(400).json({ message: 'El tamaño es obligatorio y debe ser una cadena.' });
            }
        }

        // Crear pedido
        const newOrder = await Order.create({
            user_id,
            orderCode: generateOrderCode(),
            total,
            status: status || 'Pending',
            items,
        });

        res.status(201).json({
            message: 'Pedido creado exitosamente.',
            order: newOrder,
        });
    } catch (error) {
        console.error('Error al crear el pedido:', error);
        next(error); // Manejo de errores centralizado
    }
};


export const getOrders = async (req, res, next) => {
    try {
        const userId = req.user.id;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'ID de usuario no válido.' });
        }

        const orders = await Order.find({ user_id: userId })
            .populate('items.product_id', 'name') // Trae el nombre del producto
            .populate('items.variant_id', 'size colorName') // Trae información de variantes
            .exec();

        res.status(200).json(orders);
    } catch (error) {
        console.error('Error obteniendo los pedidos:', error);
        next(error); // Manejo de errores centralizado
    }
};

export const updateOrderStatus = async (req, res, next) => {
    try {
        const { orderId, status } = req.body;

        if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({ message: 'ID de pedido no válido o no proporcionado.' });
        }

        if (!status || !['Pending', 'Delivered', 'Cancelled', 'Shipped'].includes(status)) {
            return res.status(400).json({ message: 'Estado del pedido no válido.' });
        }

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ message: 'Pedido no encontrado.' });
        }

        order.status = status;
        await order.save();

        res.status(200).json({
            message: 'Estado del pedido actualizado exitosamente.',
            order,
        });
    } catch (error) {
        console.error('Error actualizando el estado del pedido:', error);
        next(error); // Manejo de errores centralizado
    }
};

