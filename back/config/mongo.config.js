import dotenv from 'dotenv';

// Creación de variable __dirname para usar carpeta public con vercel
import path from 'path';
export const __dirname = path.resolve()

const result = dotenv.config(); 
if (result.error) {
    throw new Error("Error al cargar las variables de entorno: " + result.error);
}

export const FULL_DOMAIN_1 = process.env.FULL_DOMAIN_1 || 'http://localhost:3027';

export const JWT_SECRET = process.env.JWT_SECRET || 'S4jIRHqt'

// Configuración de MongoDB
export const mongodbUri = process.env.MONGODB_URI;
