import dotenv from 'dotenv';

// Creación de variable __dirname para usar carpeta public con vercel
import path from 'path';
export const __dirname = path.resolve()

dotenv.config();

export const FULL_DOMAIN_1 = process.env.FULL_DOMAIN_1 || 'http://localhost:3027';

export const PORT = process.env.PORT || 3027

export const JWT_SECRET = process.env.JWT_SECRET || 'S4jIRHqt'

// Configuración de MongoDB
export const mongodbUri = process.env.MONGODB_URI;
