    import dotenv from 'dotenv'; // Importa la librería dotenv para cargar variables de entorno desde un archivo .env.

    dotenv.config(); // Carga las variables de entorno desde el archivo .env a process.env.

    export const FULL_DOMAIN_1 = process.env.FULL_DOMAIN_1 || 'http://localhost:3027'; 
    // Asigna la variable FULL_DOMAIN_1, tomando el valor de la variable de entorno o un valor por defecto (localhost:3027).

    export const PORT = process.env.PORT || 3027; 
    // Asigna el puerto desde la variable de entorno o usa un puerto por defecto (3027) si no está definido.

    export const JWT_SECRET = process.env.JWT_SECRET || 'S16jIRHqt'; 
    // Asigna la clave secreta JWT desde las variables de entorno o una clave por defecto si no está definida.

    export const mongodbUri = process.env.MONGODB_URI; 
    // Asigna la URI de conexión de MongoDB desde las variables de entorno.
