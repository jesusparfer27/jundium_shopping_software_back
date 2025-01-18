import { Router } from 'express';
import { getProductById, getProductByReferenceOrCode, getProducts } from "../controllers/product.controller.js";
import { getUsers, loginUser, getUserById, getMe, updateUserById, subscribeNewsletter } from '../controllers/users.controller.js';
import { authenticateToken } from '../middlewares/auth.js';
import { addToWishlist, getWishlist, removeFromWishlist, createWishlist } from '../controllers/wishlist.controller.js';
import { adminUser, verifyAdmin } from '../controllers/admin.controller.js';
import { upload } from '../middlewares/multer.js';
import { uploadToProduct } from '../middlewares/multer2.js';
import { createProduct, uploadImages } from '../controllers/create.products.controller.js';
import { registerUser } from '../controllers/register.controller.js';
import { sendSupportEmail } from '../controllers/email.support.controller.js';
import {
    addToCart,
    getCart,
    removeFromCart,
    updateCartItem,
    updateCartQuantity,
    deleteCart
} from '../controllers/cart.controller.js';
import {
    createOrder,
    getOrders,
    updateOrderStatus
} from '../controllers/orders.controller.js';
import { addVariant, uploadImagesToProduct } from '../controllers/variant.controller.js';
import { editProduct, editVariant } from '../controllers/edit.products.controller.js';

const router = Router();


/**
 * Rutas de productos
 * - Gestiona productos y sus variantes
 */
router.get("/products", getProducts); // Obtiene todos los productos
router.get("/products/:id", getProductById); // Obtiene un producto por su ID
router.get('/product/by-reference', authenticateToken, getProductByReferenceOrCode); // Obtiene un producto por referencia o código

router.post('/create-product', upload.array('images', 5), createProduct); // Crea un nuevo producto con imágenes
router.post('/add-variant/:productReference', uploadToProduct.array('images', 5), addVariant); // Agrega una variante a un producto
router.post('/upload-images', upload.array('images', 5), uploadImages); // Sube imágenes para un producto
router.post('/upload-images/to-product', uploadToProduct.array('images', 5), uploadImagesToProduct); // Sube imágenes a un producto específico
router.post('/upload-images/:productCode', uploadToProduct.array('images', 5), uploadImages); // Sube imágenes para una variante específica de un producto

router.put('/edit-general-data/:productReference', editProduct);
router.put('/edit-variant-data/:productCode',uploadToProduct.array('images', 5), editVariant);

/**
 * Rutas de usuarios
 * - Gestiona cuentas de usuarios y su perfil
 */
router.get("/me", authenticateToken, getMe); // Obtiene el perfil del usuario actual
router.get("/users", getUsers); // Obtiene todos los usuarios
router.patch("/me/update", authenticateToken, updateUserById); // Actualiza el perfil del usuario actual
router.post("/login", loginUser, authenticateToken); // Inicia sesión de un usuario
router.post("/register", registerUser); // Registra un nuevo usuario
router.post("/newsletter", authenticateToken, subscribeNewsletter); // Suscribe al usuario al boletín

/**
 * Rutas de administración
 * - Funcionalidades exclusivas para administradores
 */
router.get("/admin", verifyAdmin, adminUser); // Accede al panel de administración (requiere verificación)

/**
 * Rutas de soporte
 * - Gestiona funcionalidades de soporte al usuario
 */
router.post('/support/email', authenticateToken, sendSupportEmail); // Envía un correo de soporte

/**
 * Rutas del carrito de compras
 * - Gestiona el carrito de compras del usuario
 */
router.post("/cart", authenticateToken, addToCart); // Agrega un producto al carrito
router.get("/cart", authenticateToken, getCart); // Obtiene los productos del carrito
router.delete("/cart/:productId/:variantId", authenticateToken, removeFromCart); // Elimina un producto específico del carrito
router.put("/cart", authenticateToken, updateCartItem); // Actualiza los detalles de un producto en el carrito
router.put("/cart", authenticateToken, updateCartQuantity); // Actualiza la cantidad de productos en el carrito
router.delete("/cart/:cartId", authenticateToken, deleteCart); // Elimina todo el carrito

/**
 * Rutas de pedidos
 * - Gestiona pedidos y su estado
 */
router.post("/create-order", authenticateToken, createOrder); // Crea un nuevo pedido
router.get("/orders", authenticateToken, getOrders); // Obtiene los pedidos del usuario
router.put("/orders/status", authenticateToken, updateOrderStatus); // Actualiza el estado de un pedido

/**
 * Rutas de wishlist
 * - Gestiona la lista de deseos del usuario
 */
router.post("/wishlist/add", authenticateToken, addToWishlist); // Agrega un producto a la lista de deseos
router.get("/wishlist", authenticateToken, getWishlist); // Obtiene los productos de la lista de deseos
router.delete("/wishlist/:productId/:variantId", authenticateToken, removeFromWishlist); // Elimina un producto específico de la lista de deseos
router.post('/wishlist/create', authenticateToken, createWishlist); // Crea una lista de deseos

export default router;
