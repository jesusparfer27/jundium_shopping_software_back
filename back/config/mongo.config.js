import dotenv from 'dotenv';

dotenv.config();

export const FULL_DOMAIN_1 = process.env.FULL_DOMAIN_1 || 'http://localhost:3027';

export const PORT = process.env.PORT || 3027

export const JWT_SECRET = process.env.JWT_SECRET || 'S16jIRHqt'

// Configuración de MongoDB
export const mongodbUri = process.env.MONGODB_URI;
