import { SupportEmail } from '../data/mongodb.js'; // Importa el modelo SupportEmail desde la base de datos

// Función para enviar un correo de soporte
export const sendSupportEmail = async (req, res, next) => {
    try {
        // Extraer los datos necesarios del cuerpo de la solicitud
        const { user_id, name, email, content } = req.body;

        // Validar que todos los campos requeridos estén presentes
        if (!user_id || !email || !content || !name) {
            return res.status(400).json({ error: 'Todos los campos son requeridos' }); // Responder con un error 400 si faltan datos
        }

        // Crear una nueva instancia del modelo SupportEmail con los datos proporcionados
        const newSupportEmail = new SupportEmail({
            user_id,              // ID del usuario que envía el correo
            first_name: name,     // Nombre del usuario
            user_email: email,    // Dirección de correo del usuario
            content               // Contenido del correo
        });

        // Guardar el nuevo correo en la base de datos
        const savedEmail = await newSupportEmail.save();

        // Responder con éxito y devolver los datos guardados
        res.status(201).json({ message: 'Correo enviado correctamente', data: savedEmail });
    } catch (error) {
        // Pasar cualquier error al middleware de manejo de errores
        next(error);
    }
};
