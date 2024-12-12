import { connectDB } from '../data/mongodb.js';
import { Order, User, Product } from '../data/mongodb.js';
import mongoose from 'mongoose';
import { authenticateToken } from '../middlewares/auth.js';

// Conectar a la base de datos
connectDB(); 

const createOrder = async (req, res) => {
    const userId = req.user.id;
    const { items, total, payment_methods } = req.body;

    try {
        // Validar que los items tengan todos los campos necesarios
        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'El pedido debe incluir al menos un artículo.' });
        }

        // Crear la nueva orden directamente
        await Order.create({
            user_id: userId,
            items,
            total,
            payment_methods
        });

        // Responder con un mensaje de éxito
        res.status(201).json({ message: 'Pedido creado exitosamente.' });
    } catch (error) {
        res.status(500).json({ message: 'Error creando el pedido', error: error.message });
    }
};

const getOrders = async (req, res) => {
    const userId = req.user.id;

    try {
        const orders = await Order.find({ user_id: userId });
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Error obteniendo los pedidos', error });
    }
};

const updateOrderStatus = async (req, res) => {
    const { orderId, status } = req.body;

    try {
        const order = await Order.findById(orderId);
        
        if (!order) {
            return res.status(404).json({ message: 'Pedido no encontrado' });
        }

        order.status = status;
        await order.save();
        res.status(200).json({ message: 'Estado del pedido actualizado', order });
    } catch (error) {
        res.status(500).json({ message: 'Error actualizando el estado del pedido', error });
    }
};

// Exportar funciones
export { createOrder, getOrders, updateOrderStatus };
