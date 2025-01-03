import { connectDB } from '../data/mongodb.js';
import { Order } from '../data/mongodb.js'; // Asegúrate de importar correctamente el modelo
import mongoose from 'mongoose';
import { authenticateToken } from '../middlewares/auth.js';
import { Product } from '../data/mongodb.js';
import crypto from 'crypto';

connectDB();

export const generateOrderCode = () => {
    return crypto.randomBytes(6).toString('hex').toUpperCase(); // Genera un código aleatorio único
};

export const createOrder = async (req, res, next) => {
    const session = await mongoose.startSession(); // Inicia una sesión para la transacción
    session.startTransaction(); // Inicia una transacción
    try {
        const { user_id, items, total, status } = req.body;

        if (!user_id || !mongoose.Types.ObjectId.isValid(user_id)) {
            return res.status(400).json({ message: 'ID de usuario no válido o no proporcionado.' });
        }

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: 'Debe proporcionar al menos un artículo en el pedido.' });
        }

        if (!total || typeof total !== 'number' || total <= 0) {
            return res.status(400).json({ message: 'El total debe ser un número positivo.' });
        }

        // Validación y actualización de stock por cada artículo
        for (const item of items) {
            const { product_id, variant_id, quantity, size } = item;

            const product = await Product.findOne(
                { _id: product_id, 'variants.variant_id': variant_id },
                { 'variants.$': 1 } // Selecciona solo la variante correspondiente
            ).session(session);

            if (!product) {
                throw new Error(`Producto con ID ${product_id} o variante ${variant_id} no encontrado.`);
            }

            const variant = product.variants[0]; // Accede a la variante seleccionada
            const sizeIndex = variant.sizes.findIndex((s) => s.size === size);

            if (sizeIndex === -1) {
                throw new Error(`Tamaño ${size} no encontrado para la variante ${variant_id}.`);
            }

            if (variant.sizes[sizeIndex].stock < quantity) {
                throw new Error(`Stock insuficiente para el tamaño ${size} del producto ${product_id}.`);
            }

            // Reduce el stock en la base de datos sin hacer un save del producto
            await Product.updateOne(
                { _id: product_id, 'variants.variant_id': variant_id },
                {
                    $inc: { [`variants.$.sizes.${sizeIndex}.stock`]: -quantity }, // Resta la cantidad del stock
                    $set: { [`variants.$.sizes.${sizeIndex}.out_of_stock`]: variant.sizes[sizeIndex].stock - quantity <= 0 }
                },
                { session }
            );
        }

        // Crear el pedido
        const newOrder = await Order.create(
            [
                {
                    user_id,
                    orderCode: generateOrderCode(),
                    total,
                    status: status || 'Pending',
                    items,
                }
            ],
            { session }
        );

        await session.commitTransaction(); // Confirma la transacción
        session.endSession();

        res.status(201).json({
            message: 'Pedido creado exitosamente.',
            order: newOrder,
        });
    } catch (error) {
        await session.abortTransaction(); // Revierte los cambios si hay un error
        session.endSession();
        console.error('Error al crear el pedido:', error);
        next(error);
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

