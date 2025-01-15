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

router.post('/add-variant/:productReference', uploadToProduct.array('images', 5), addVariant)
router.post('/upload-images/to-product', uploadToProduct.array('images', 5), uploadImagesToProduct)

// router.post('/products/:productId/variants', upload.array('images', 5), addVariantToProduct);
router.get('/product/by-reference', authenticateToken, getProductByReferenceOrCode);

router.put('/edit-general-data/:productReference', editProduct);
router.put('/edit-variant-data/:productCode',uploadToProduct.array('images', 5), editVariant);

router.post('/upload-images/:productCode', uploadToProduct.array('images', 5), uploadImages);

router.post("/cart", authenticateToken, addToCart);
router.get("/cart", authenticateToken, getCart);
router.delete("/cart/:productId/:variantId", authenticateToken, removeFromCart);
router.put("/cart", authenticateToken, updateCartItem);
router.put("/cart", authenticateToken, updateCartQuantity);
router.delete("/cart/:cartId", authenticateToken, deleteCart)

router.post("/create-order", authenticateToken, createOrder);
router.get("/orders", authenticateToken, getOrders);
router.put("/orders/status", authenticateToken, updateOrderStatus);

router.post("/wishlist/add", authenticateToken, addToWishlist);
router.get("/wishlist", authenticateToken, getWishlist);
router.delete("/wishlist/:productId/:variantId", authenticateToken, removeFromWishlist);
router.post('/wishlist/create', authenticateToken, createWishlist);

router.get("/products/filter", getProducts);


export default router;
