import jwt from 'jsonwebtoken'; // Importa la librería 'jsonwebtoken' para trabajar con tokens JWT.
import { JWT_SECRET } from '../config/mongo.config.js'; // Importa la clave secreta para firmar/verificar tokens desde la configuración.

export const authenticateToken = (req, res, next) => {
    // Obtiene el encabezado de autorización de la solicitud.
    const authHeader = req.headers['authorization'];

    // Extrae el token del encabezado si está presente.
    const token = authHeader && authHeader.split(' ')[1];

    // Si no hay un token en la solicitud, devuelve un error 401 (Unauthorized).
    if (!token) return res.status(401).send('Token no proporcionado'); 

    // Verifica el token utilizando la clave secreta.
    jwt.verify(token, JWT_SECRET, (err, user) => {
        // Si hay un error durante la verificación (por ejemplo, token inválido o expirado).
        if (err) {
            console.error("Error al verificar token:", err); // Registra el error en la consola.
            return res.status(403).send('Token inválido o expirado'); // Devuelve un error 403 (Forbidden).
        }

        // Si el token es válido, almacena la información del usuario decodificada en `req.user`.
        req.user = user;

        // Llama al siguiente middleware o controlador de la cadena de solicitudes.
        next();
    });
};
