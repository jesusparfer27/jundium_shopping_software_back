import { Router } from 'express';
import getProducts, { getProductById } from "../controllers/product.controller.js";
import { getUsers, loginUser, getUserById, getMe, updateUserById, subscribeNewsletter } from '../controllers/users.controller.js';
import { authenticateToken } from '../middlewares/auth.js';
import { addToWishlist, getWishlist, removeFromWishlist, createWishlist } from '../controllers/wishlist.controller.js';
import { adminUser, verifyAdmin } from '../controllers/admin.controller.js';
import { upload } from '../middlewares/multer.js';
import { createProduct, uploadImages } from '../controllers/create.products.controller.js';
import { registerUser } from '../controllers/register.controller.js';
import { sendSupportEmail } from '../controllers/email.support.controller.js';
import {
    addToCart,
    getCart,
    removeFromCart,
    updateCartItem,
    updateCartQuantity
} from '../controllers/cart.controller.js';
import {
    createOrder,
    getOrders,
    updateOrderStatus
} from '../controllers/orders.controller.js';

const router = Router();

router.get("/products", getProducts);
router.get("/products/:id", getProductById);
router.get("/me", authenticateToken, getMe);
router.get("/users", getUsers);

router.patch("/me/update", authenticateToken, updateUserById)

router.get("/admin", verifyAdmin, adminUser);

router.post("/login", loginUser, authenticateToken);
router.post("/register", registerUser);
router.post("/newsletter", authenticateToken, subscribeNewsletter)
router.post('/support/email', authenticateToken, sendSupportEmail);

router.post('/create-product', upload.array('images', 5), createProduct); 
router.post('/upload-images', upload.array('images', 5), uploadImages);


router.post("/cart", authenticateToken, addToCart);
router.get("/cart", authenticateToken, getCart);
router.delete("/cart/:productId/:variantId", authenticateToken, removeFromCart);
router.put("/cart", authenticateToken, updateCartItem);
router.put("/cart", authenticateToken, updateCartQuantity);


router.post("/orders", authenticateToken, createOrder);
router.get("/orders", authenticateToken, getOrders);
router.put("/orders/status", authenticateToken, updateOrderStatus);

router.post("/wishlist/add", authenticateToken, addToWishlist);
router.get("/wishlist", authenticateToken, getWishlist);
router.delete("/wishlist/:productId/:variantId", authenticateToken, removeFromWishlist);
router.post('/wishlist/create', authenticateToken, createWishlist);


router.get("/products/filter", getProducts);


export default router;
