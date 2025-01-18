import { connectDB } from '../data/mongodb.js';  // Importa la función para conectar a la base de datos MongoDB
import { User } from '../data/mongodb.js';  // Importa el modelo de usuario desde la base de datos
import jwt from 'jsonwebtoken';  // Importa la librería jsonwebtoken para manejar tokens JWT

connectDB(); // Llama a la función para establecer la conexión con la base de datos MongoDB

// Middleware para verificar si el usuario tiene permisos de administrador
export const verifyAdmin = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];  // Obtener el token
        if (!token) { // Si no se encuentra un token, retorna un error 401
            return res.status(401).json({ message: 'No autorizado, se requiere un token.' });
        }

        // Verifica y decodifica el token JWT utilizando la clave secreta del entorno
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;  // Extrae el ID del usuario del token decodificado

        // Busca al usuario en la base de datos utilizando el ID extraído del token
        const user = await User.findById(userId);
        if (!user) {  // Si el usuario no existe, retorna un error 404
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        // Obtiene los permisos del usuario desde su perfil en la base de datos
        const permissions = user.permissions;

        // Define los permisos requeridos para acceder a la siguiente parte del sistema
        const requiredPermissions = ['manage_users', 'view_reports', 'manage_products', 'manage_orders'];
        const hasRequiredPermissions = requiredPermissions.every(permission => permissions[permission]); // Verifica si el usuario tiene todos los permisos necesarios

        // Si el usuario no tiene los permisos necesarios, retorna un error 403
        if (!hasRequiredPermissions) {
            return res.status(403).json({ message: 'Acceso denegado. Se requieren permisos administrativos.' });
        }

        // Si el usuario tiene permisos, pasa el control al siguiente middleware
        req.user = user;
        next();
    } catch (error) {
        console.error(error); // Imprime el error en la consola si ocurre uno
        next(error);  // Pasa el error al siguiente middleware de manejo de errores
    }
};

// Middleware para manejar la lógica de usuario administrador y responder con información sobre los permisos
export const adminUser = async (req, res, next) => {
    try {
        console.log("Ver contenido privado de admin");

        // Obtiene el usuario que ha sido validado por el middleware verifyAdmin
        const user = req.user;

        // Obtener los permisos del usuario (esto depende de cómo estés guardando los permisos en el modelo User)
        const userPermissions = user.permissions || {
            manage_orders: true,
            manage_products: true,
            manage_users: true,
            view_reports: true,
        };

        // Verificar si el usuario tiene todos los permisos necesarios (puedes ajustar esta lógica según tus necesidades)
        const requiredPermissions = ['manage_users', 'view_reports', 'manage_products', 'manage_orders'];
        const hasRequiredPermissions = requiredPermissions.every(permission => userPermissions[permission]);

        // Si no tiene los permisos adecuados, devolver un error 403
        if (!hasRequiredPermissions) {
            return res.status(403).json({ message: 'Acceso denegado. Se requieren permisos administrativos.' });
        }

        // Obtener los datos de los usuarios o cualquier otra información que desees
        const users = await User.find();  // Ejemplo: obtener todos los usuarios

        // Responder con los permisos y los datos que se necesitan
        res.status(200).json({
            permissions: userPermissions,
            data: users,  // Puedes modificar esto para devolver la información que necesites
            message: 'Datos del administrador y permisos obtenidos con éxito.',
        });

    } catch (error) {
        console.error("Error en adminUser:", error);  // Imprimir detalles del error
        res.status(500).json({ message: "Error interno del servidor" });
    }
};
