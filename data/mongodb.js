import mongoose from 'mongoose';
import { mongodbUri } from '../config/mongo.config.js';
import { type } from 'os';

const connectDB = async () => {
    try {
        await mongoose.connect(mongodbUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log("MongoDB conectado correctamente");
    } catch (error) {
        console.error("Error conectando a MongoDB: ", error);
        process.exit(1);
    }
};

const userSchema = new mongoose.Schema({
    first_name: {
        type: String,
        required: true
    },
    last_name: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: function (v) {
                return /^\S+@\S+\.\S+$/.test(v);
            },
            message: props => `${props.value} no es un correo válido!`
        }
    },
    phone_number: {
        type: String,
        default: ""
    },
    gender: {
        type: String,
        enum: ['masculino', 'femenino', 'otro'],
        required: true,
        set: function (value) {
            return value.toLowerCase();
        }
    },
    birth_date: {
        type: Date,
    },
    permissions: {
        manage_users: {
            type: Boolean,
            default: false
        },
        manage_products: {
            type: Boolean,
            default: false
        },
        view_reports: {
            type: Boolean,
            default: false
        },
        manage_orders: {
            type: Boolean,
            default: false
        }
    },
    wishlist: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Wishlist'
    },
    orders: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'Order'
    },
    cart: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Cart'
    },
    contact_preferences: {
        email: {
            type: Boolean,
            default: false
        },
        phone: {
            type: Boolean,
            default: false
        },
        whatsapp: {
            type: Boolean,
            default: false
        }
    },
    newsletter: {
        subscribed: {
            type: Boolean,
            default: false,
        },
        subscription_date: {
            type: Date,
        }
    },
    country: {
        type: String,
        enum: ['México', 'Argentina', 'Colombia', 'Chile', 'Perú', 'España'],
    },
    location: {
        city: {
            type: String,
            default: "",
        },
        street: {
            type: String,
            default: "",
        },
        postal_code: {
            type: String,
            default: ""
        }
    }
}, {
    timestamps: true,
    versionKey: false,
    strict: false
});

const supportEmailSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    first_name: {
        type: String,
        required: true
    },
    user_email: {
        type: String,
        required: true,
        validate: {
            validator: function (v) {
                return /^\S+@\S+\.\S+$/.test(v);
            },
            message: props => `${props.value} no es un correo válido!`
        }
    },
    content: {
        type: String,
        required: true
    },
    sent_date: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    versionKey: false
});

const productSchema = new mongoose.Schema({
    collection: {
        type: String,
        required: true
    },
    brand: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    gender: {
        type: String,
        enum: ['hombre', 'mujer', 'unisex'],
        required: true
    },
    variants: [
        {
            _id: { type: mongoose.Schema.Types.ObjectId, auto: false },
            variant_id: {
                type: mongoose.Schema.Types.ObjectId,
                required: true
            },
            product_reference: {
                type: String,
            },
            name: {
                type: String,
                required: true
            },
            discount: {
                type: Number,
                default: 0
            },
            product_code: {
                type: String,
                required: true,
                unique: true
            },
            out_of_stock: {
                type: Boolean,
                default: false
            },
            color: {
                colorName: {
                    type: String,
                    required: true
                },
                hexCode: {
                    type: String
                }
            },
            sizes: [
                {
                    size: {
                        type: String,
                        required: true
                    },
                    stock: {
                        type: Number,
                        required: true
                    }
                }
            ],
            material: {
                type: String,
                required: true
            },
            description: {
                type: String,
                required: true
            },
            price: {
                type: Number,
                required: true
            },
            image: {
                type: [String],
                required: true
            },
            is_main: {
                type: Boolean,
                default: false
            }
        }
    ],
    new_arrival: {
        type: Boolean,
        default: false
    },
    featured: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    versionKey: false,
    strict: false
});

const wishlistSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [
        {
            product_id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
                required: true
            },
            variant_id: {
                type: mongoose.Schema.Types.ObjectId,
                required: true,
            },
            added_at: {
                type: Date,
                default: Date.now
            }
        }
    ]
}, {
    timestamps: true,
    versionKey: false
});


const cartSchema = new mongoose.Schema({
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    items: [
      {
        product_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true
        },
        variant_id: {
          type: mongoose.Schema.Types.ObjectId,
          required: true
        },
        quantity: {
          type: Number,
          required: true,
          default: 1
        },
        colorName: {
          type: String,
          required: false
        },
        size: {
          type: String,
          required: false
        },
        price: {
            type: Number,
            required: true
          }
      }
    ],
    total_price: {
      type: Number,
      default: 0
    },
    created_at: {
      type: Date,
      default: Date.now
    }
  }, {
    timestamps: true,
    versionKey: false
  });

// Schema de Orders
const orderSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    orderCode: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    total: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Delivered', 'Cancelled', 'Shipped'],
        default: 'Pending'
    },
    items: [
        {
            product_id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
                required: true
            },
            variant_id: {
                type: mongoose.Schema.Types.ObjectId,
                required: true
            },
            quantity: {
                type: Number,
                required: true,
                default: 1
            },
            price: {
                type: Number,
                required: true
            },
            colorName: {
                type: String,
                required: true
            },
            size: {
                type: String,
                required: true
            }
        }
    ],
    payment_methods: [
        {
            card_type: {
                type: String,
                required: true
            },
            card_number: {
                type: String,
                required: true
            },
            expiry_date: {
                type: String,
                required: true
            }
        }
    ]
}, {
    timestamps: true,
    versionKey: false
});

// Modelos
const User = mongoose.model('User', userSchema, 'accounts');
const Product = mongoose.model('Product', productSchema, 'products');
const Wishlist = mongoose.model('Wishlist', wishlistSchema, 'wishlists');
const Order = mongoose.model('Order', orderSchema);
const Cart = mongoose.model('Cart', cartSchema, 'cart');
const SupportEmail = mongoose.model('SupportEmail', supportEmailSchema, 'support_emails');

// Exportar la conexión y los modelos
export { connectDB, User, Product, Wishlist, Order, Cart, SupportEmail };
