import express from 'express'
import cors from 'cors'
import { PORT, JWT_SECRET, FULL_DOMAIN_1 } from './config/mongo.config.js'
import mongoRoutes from './routes/mongodb.routes.js'
import path from 'path'

// Utilities
const app = express()

// Middlewares

app.use(cors());
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// rutas
// Solución para __dirname
const __dirname = path.resolve();
app.use(express.static(path.join(__dirname, "public")))


app.get('/', (req, res) => {

    res.setHeader("Content-Type", "text/html")

    const landingHTML = `
        <h1>Bienvenidos a nuestra REST-API</h1>
        <p>Servidor uniciado en ${FULL_DOMAIN_1}</p>
    `;

    res.status(200).send(landingHTML)
})

// Rutas para mysql
// app.use("/API/v1/", apiRoutes)

// Rutas para mongoDB
app.use('/API/v1/', mongoRoutes)

// Rutas
app.listen(PORT, () => {
    console.log(`Iniciando API en ${FULL_DOMAIN_1}`)
})