import { connectDB } from '../data/mongodb.js';
import { User } from '../data/mongodb.js';
import bcrypt from 'bcrypt';
import { JWT_SECRET } from '../config/mongo.config.js';
import jwt from 'jsonwebtoken';

// Conectar a la base de datos
connectDB();

// Controlador para obtener todos los usuarios
export const getUsers = async (req, res) => {
    try {
        const users = await User.find({}, { password: 0 }); // Consultar usuarios excluyendo la contraseña
        if (users.length === 0) {
            // Responder con un mensaje si no hay usuarios
            return res.status(404).json({
                message: "No se encontraron usuarios",
                success: false
            });
        }

        // Responder con la lista de usuarios
        res.status(200).json({
            data: users,
            message: "Usuarios obtenidos exitosamente",
            success: true
        });
    } catch (error) {
        // Manejo de errores
        console.error("Error al obtener los usuarios:", error);
        res.status(500).json({
            message: "Error en el servidor",
            success: false,
            error: error.message
        });
    }
};

// Controlador para registrar un usuario
export const postUsers = async (req, res) => {
    try {
        const { first_name, last_name, email, password } = req.body; // Extraer datos del cuerpo de la solicitud

        // Validar que todos los campos requeridos estén presentes
        if (!first_name || !last_name || !email || !password) {
            return res.status(400).json({
                message: "Faltan campos obligatorios",
                success: false
            });
        }

        // Verificar si el usuario ya existe en la base de datos
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({
                message: "El usuario ya existe",
                success: false
            });
        }

        // Hash de la contraseña antes de guardarla
        const hashedPassword = await bcrypt.hash(password, 10);

        // Crear un nuevo usuario en la base de datos
        const newUser = new User({
            first_name,
            last_name,
            email,
            password: hashedPassword
        });

        await newUser.save(); // Guardar el usuario en la base de datos

        // Responder con los datos del nuevo usuario
        res.status(201).json({
            data: { id: newUser._id, first_name: newUser.first_name, last_name: newUser.last_name, email: newUser.email },
            message: "Usuario creado exitosamente",
            success: true
        });
    } catch (error) {
        // Manejo de errores
        console.error("Error al crear el usuario:", error);
        res.status(500).json({
            message: "Error en el servidor",
            success: false,
            error: error.message
        });
    }
};


// Controlador para iniciar sesión
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body; // Extraer datos del cuerpo de la solicitud

        // Validar que los campos email y password estén presentes
        if (!email || !password) {
            return res.status(400).json({
                message: "Por favor, proporciona email y contraseña.",
                success: false,
            });
        }

        // Verificar si el usuario existe en la base de datos
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                message: "Usuario no encontrado",
                success: false,
            });
        }

        // Comparar la contraseña ingresada con la almacenada
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(401).json({
                message: "Correo electrónico o contraseña incorrectos",
                success: false,
            });
        }

        // Generar un token JWT con una duración de 2 horas
        const existingToken = jwt.sign(
            { email: user.email, id: user._id },
            JWT_SECRET,
            { expiresIn: '3h' }
        );

        // Decodificar el token para verificar tiempo de expiración
        const decodedToken = jwt.decode(existingToken);
        const currentTime = Math.floor(Date.now() / 1000);

        // Si el token está cerca de expirar, generar uno nuevo con tiempo extendido
        if (decodedToken.exp - currentTime < 300) {
            const refreshedToken = jwt.sign(
                { email: user.email, id: user._id },
                JWT_SECRET,
                { expiresIn: '5m' }
            );
            return res.status(200).json({
                data: {
                    id: user._id,
                    email: user.email,
                    first_name: user.first_name
                },
                message: "Login correcto",
                success: true,
                token: refreshedToken, // Enviar el token extendido
            });
        }

        // Responder con el token original si no está cerca de expirar
        res.status(200).json({
            data: {
                id: user._id,
                email: user.email,
                first_name: user.first_name
            },
            message: "Login correcto",
            success: true,
            token: existingToken,
        });
    } catch (error) {
        // Manejo de errores
        console.error("Error al iniciar sesión:", error);
        res.status(500).json({
            message: "Error en el servidor",
            success: false,
            error: error.message,
        });
    }
};


// Controlador para obtener un usuario por ID
export const getUserById = async (req, res) => {
    // Obtener el token del encabezado de autorización
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
        // Respuesta si no se proporciona un token
        return res.status(401).json({ message: 'Token no proporcionado', success: false });
    }

    try {
        // Verificar el token para extraer el ID del usuario
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.id;

        // Buscar el usuario en la base de datos, excluyendo la contraseña
        const user = await User.findById(userId, { password: 0 });
        if (!user) {
            // Respuesta si no se encuentra el usuario
            return res.status(404).json({ message: 'Usuario no encontrado', success: false });
        }

        // Respuesta exitosa con los datos del usuario
        return res.status(200).json({
            data: user,
            message: "Usuario obtenido correctamente",
            success: true
        });
    } catch (error) {
        // Manejo de errores del servidor
        console.error("Error al obtener el usuario:", error);
        return res.status(500).json({
            message: 'Error en el servidor',
            success: false,
            error: error.message
        });
    }
};

// Controlador para obtener los detalles del usuario actual
export const getMe = async (req, res) => {
    // Obtener el token del encabezado de autorización
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
        // Respuesta si no se proporciona un token
        return res.status(401).json({ message: 'Token no proporcionado', success: false });
    }

    try {
        // Verificar el token para extraer el ID del usuario
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.id;

        // Buscar el usuario en la base de datos, excluyendo la contraseña
        const user = await User.findById(userId, { password: 0 });
        if (!user) {
            // Respuesta si no se encuentra el usuario
            return res.status(404).json({ message: 'Usuario no encontrado', success: false });
        }

        // Respuesta exitosa con los datos del usuario actual
        return res.status(200).json({
            data: user,
            message: "Usuario actual obtenido correctamente",
            success: true
        });
    } catch (error) {
        // Manejo de errores del servidor
        console.error('Error al obtener el usuario:', error);
        return res.status(500).json({
            message: 'Error en el servidor',
            success: false,
            error: error.message
        });
    }
};

// Controlador para actualizar la información del usuario logueado
export const updateUserById = async (req, res) => {
    // Obtener el token del encabezado de autorización
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
        // Respuesta si no se proporciona un token
        return res.status(401).json({ message: 'Token no proporcionado', success: false });
    }

    try {
        // Verificar el token para extraer el ID del usuario
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.id;

        // Extraer los datos del cuerpo de la solicitud
        const { first_name, gender, country, phone_number, last_name, email, password, contact_preferences, birth_date, postal_code, location } = req.body;

        // Validar que se proporcionen datos para actualizar
        if (!first_name && !last_name && !email && !password && !location) {
            return res.status(400).json({ message: 'No se proporcionaron campos para actualizar', success: false });
        }

        // Crear un objeto con los campos que se actualizarán
        const updateFields = {};
        if (first_name) updateFields.first_name = first_name;
        if (last_name) updateFields.last_name = last_name;
        if (email) updateFields.email = email;
        if (password) {
            // Hash de la nueva contraseña antes de guardarla
            const hashedPassword = await bcrypt.hash(password, 10);
            updateFields.password = hashedPassword;
        }
        if (postal_code) updateFields.postal_code = postal_code;
        if (gender) updateFields.gender = gender;
        if (phone_number) updateFields.phone_number = phone_number;
        if (country) updateFields.country = country;
        if (contact_preferences) {
            // Asegurarse de que contact_preferences tenga una estructura válida
            const { email, phone, whatsapp } = contact_preferences;
            updateFields.contact_preferences = {
                email: Boolean(email),
                phone: Boolean(phone),
                whatsapp: Boolean(whatsapp)
            };
        }
        if (birth_date && birth_date.day && birth_date.month !== undefined && birth_date.year) {
            // Convertir la fecha a un objeto Date completo
            const completeDate = new Date(birth_date.year, birth_date.month, birth_date.day);
            updateFields.birth_date = completeDate;
        }
        if (location) {
            // Actualizar la ubicación si se proporcionó
            updateFields.location = {};
            if (location.city) updateFields.location.city = location.city;
            if (location.street) updateFields.location.street = location.street;
            if (location.postal_code) updateFields.location.postal_code = location.postal_code;
        }

        // Actualizar el usuario en la base de datos
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updateFields },
            { new: true, select: { password: 0 } } // Excluir la contraseña en la respuesta
        );

        if (!updatedUser) {
            // Respuesta si no se encuentra el usuario
            return res.status(404).json({ message: 'Usuario no encontrado', success: false });
        }

        // Respuesta exitosa con los datos actualizados
        return res.status(200).json({
            data: updatedUser,
            message: 'Usuario actualizado exitosamente',
            success: true
        });

    } catch (error) {
        // Manejo de errores del servidor
        console.error("Error al actualizar el usuario:", error);
        return res.status(500).json({
            message: 'Error en el servidor',
            success: false,
            error: error.message
        });
    }
};


// Controlador para suscribir al usuario a la newsletter
export const subscribeNewsletter = async (req, res) => {
    // Obtener el token del encabezado de autorización
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
        // Respuesta si no se proporciona un token
        return res.status(401).json({ message: 'Token no proporcionado', success: false });
    }

    try {
        // Verificar el token para extraer el ID del usuario
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.id;

        // Buscar el usuario en la base de datos
        const user = await User.findById(userId);
        if (!user) {
            // Respuesta si no se encuentra el usuario
            return res.status(404).json({ message: 'Usuario no encontrado', success: false });
        }

        // Validar que el email proporcionado coincida con el del usuario logueado
        const { email } = req.body;
        if (email.toLowerCase().trim() !== user.email.toLowerCase().trim()) {
            return res.status(400).json({
                message: 'El correo proporcionado no coincide con el correo del usuario logueado.',
                success: false
            });
        }

        // Actualizar la suscripción a la newsletter
        user.newsletter.subscribed = true;
        user.newsletter.subscription_date = new Date();
        await user.save();

        // Respuesta exitosa con los datos de suscripción
        return res.status(200).json({
            data: { email: user.email, subscribed: user.newsletter.subscribed },
            message: "Usuario suscrito exitosamente a la newsletter",
            success: true
        });

    } catch (error) {
        // Manejo de errores del servidor
        console.error("Error al suscribir a la newsletter:", error);
        return res.status(500).json({
            message: 'Error en el servidor',
            success: false,
            error: error.message
        });
    }
};