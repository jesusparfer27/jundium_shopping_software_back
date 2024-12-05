import express from 'express';
import cors from 'cors';
import { PORT, FULL_DOMAIN_1 } from '../config/mongo.config.js';
import mongoRoutes from '../routes/mongodb.routes.js';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();

// Obtener __dirname para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas estáticas para imágenes
app.use('/images', express.static(path.join(__dirname, '../public/images')));

app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(`
    <h1>Bienvenidos a nuestra REST-API</h1>
    <p>Servidor iniciado en ${FULL_DOMAIN_1}</p>
  `);
});

// Rutas para MongoDB
app.use('/API/v1', mongoRoutes);

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

export default app;
