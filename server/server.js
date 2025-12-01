import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import fs from 'fs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Get directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MySQL connection pool
let pool;

async function initializeDatabase() {
  try {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'StockMaster',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully!');
    
    // Create inventory_transactions table if it doesn't exist
    await createInventoryTransactionsTable(connection);
    
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

async function createInventoryTransactionsTable(connection) {
  try {
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS inventory_transactions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        product_id INT NOT NULL,
        user_id INT NOT NULL,
        type ENUM('IN', 'OUT', 'ADJUST', 'RETURN', 'TRANSFER') NOT NULL,
        quantity DECIMAL(10,2) NOT NULL,
        previous_stock DECIMAL(10,2) NOT NULL,
        new_stock DECIMAL(10,2) NOT NULL,
        reference VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_product_id (product_id),
        INDEX idx_user_id (user_id),
        INDEX idx_created_at (created_at DESC),
        INDEX idx_type (type)
      )
    `);
    console.log('✅ inventory_transactions table checked/created');
  } catch (error) {
    console.error('❌ Error creating inventory_transactions table:', error.message);
  }
}

initializeDatabase();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Helper function to log activities
async function logActivity(type, description, userId, productId = null) {
  if (!pool) return;
  
  try {
    await pool.execute(
      'INSERT INTO activity_logs (type, description, user_id, product_id) VALUES (?, ?, ?, ?)',
      [type, description, userId, productId]
    );
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}

// Helper function to log inventory transactions
async function logInventoryTransaction(productId, userId, type, quantity, previousStock, newStock, reference = null, notes = null) {
  if (!pool) return;
  
  try {
    await pool.execute(
      'INSERT INTO inventory_transactions (product_id, user_id, type, quantity, previous_stock, new_stock, reference, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [productId, userId, type, quantity, previousStock, newStock, reference, notes]
    );
  } catch (error) {
    console.error('Failed to log inventory transaction:', error);
  }
}

// Routes

// Health check
app.get('/api/health', async (req, res) => {
  const dbStatus = pool ? 'connected' : 'disconnected';
  
  // Check if tables exist
  let activityLogsExists = false;
  let inventoryTransactionsExists = false;
  
  try {
    if (pool) {
      await pool.execute('SELECT 1 FROM activity_logs LIMIT 1');
      activityLogsExists = true;
      
      await pool.execute('SELECT 1 FROM inventory_transactions LIMIT 1');
      inventoryTransactionsExists = true;
    }
  } catch (error) {
    // Tables don't exist or other error
  }
  
  res.json({ 
    message: 'Server is running', 
    database: dbStatus,
    activity_logs_table: activityLogsExists ? '✅ Exists' : '❌ Missing',
    inventory_transactions_table: inventoryTransactionsExists ? '✅ Exists' : '❌ Missing',
    timestamp: new Date().toISOString() 
  });
});

// Upload profile picture route
app.post('/api/upload-profile-picture', authenticateToken, upload.single('profile_picture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const userId = req.user.userId;
    const profilePicturePath = `/uploads/${req.file.filename}`;

    // Update user profile picture in database
    await pool.execute(
      'UPDATE users SET profile_picture = ? WHERE id = ?',
      [profilePicturePath, userId]
    );

    // Get updated user
    const [users] = await pool.execute(
      'SELECT id, name, email, company_name, profile_picture, role, created_at FROM users WHERE id = ?',
      [userId]
    );

    // Log activity
    await logActivity(
      'PROFILE_UPDATED',
      'Updated profile picture',
      userId
    );

    res.json({
      message: 'Profile picture uploaded successfully',
      user: users[0]
    });
  } catch (error) {
    console.error('Upload profile picture error:', error);
    res.status(500).json({ message: 'Error uploading profile picture' });
  }
});

// Remove profile picture
app.delete('/api/profile/picture', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Update user to remove profile picture
    await pool.execute(
      'UPDATE users SET profile_picture = NULL WHERE id = ?',
      [userId]
    );

    // Get updated user
    const [users] = await pool.execute(
      'SELECT id, name, email, company_name, profile_picture, role, created_at FROM users WHERE id = ?',
      [userId]
    );

    // Log activity
    await logActivity(
      'PROFILE_UPDATED',
      'Removed profile picture',
      userId
    );

    res.json({
      message: 'Profile picture removed successfully',
      user: users[0]
    });
  } catch (error) {
    console.error('Remove profile picture error:', error);
    res.status(500).json({ message: 'Error removing profile picture' });
  }
});

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  if (!pool) {
    return res.status(500).json({ 
      message: 'Database not connected. Please check server logs.' 
    });
  }

  try {
    const { name, email, password, company_name } = req.body;
    
    console.log('Registration attempt for:', email);
    
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password, company_name) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, company_name || '']
    );
    
    const token = jwt.sign(
      { userId: result.insertId, email },
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: '24h' }
    );
    
    // Get the newly created user
    const [users] = await pool.execute(
      'SELECT id, name, email, company_name, profile_picture, role, created_at FROM users WHERE id = ?',
      [result.insertId]
    );
    
    const newUser = users[0];
    
    console.log('✅ User registered successfully:', newUser.id);
    
    // Log activity
    await logActivity(
      'USER_REGISTERED',
      `New user registered: ${name} (${email})`,
      result.insertId
    );
    
    res.status(201).json({ 
      message: 'User created successfully',
      token,
      user: newUser
    });
  } catch (error) {
    console.error('❌ Registration error:', error.message);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Email already exists' });
    }
    
    res.status(500).json({ 
      message: 'Registration failed. Please try again.',
      error: error.message 
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  if (!pool) {
    return res.status(500).json({ 
      message: 'Database not connected. Please check server logs.' 
    });
  }

  try {
    const { email, password } = req.body;
    
    console.log('Login attempt for:', email);
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const [users] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    
    if (users.length === 0) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }
    
    const user = users[0];
    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }
    
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: '24h' }
    );
    
    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      company_name: user.company_name,
      profile_picture: user.profile_picture,
      role: user.role,
      created_at: user.created_at
    };

    console.log('✅ User logged in successfully:', user.id);
    
    // Log activity
    await logActivity(
      'USER_LOGIN',
      'User logged in successfully',
      user.id
    );
    
    res.json({
      message: 'Login successful',
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('❌ Login error:', error.message);
    res.status(500).json({ 
      message: 'Login failed. Please try again.',
      error: error.message 
    });
  }
});

// Update profile route
app.put('/api/profile', authenticateToken, async (req, res) => {
  if (!pool) {
    return res.status(500).json({ 
      message: 'Database not connected. Please check server logs.' 
    });
  }

  try {
    const userId = req.user.userId;
    const { name, email, company_name } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    // Update user in database
    await pool.execute(
      'UPDATE users SET name = ?, email = ?, company_name = ? WHERE id = ?',
      [name, email, company_name || '', userId]
    );

    // Get updated user
    const [users] = await pool.execute(
      'SELECT id, name, email, company_name, profile_picture, role, created_at FROM users WHERE id = ?',
      [userId]
    );

    // Log activity
    await logActivity(
      'PROFILE_UPDATED',
      `Updated profile information`,
      userId
    );

    res.json({ 
      message: 'Profile updated successfully',
      user: users[0]
    });
  } catch (error) {
    console.error('❌ Profile update error:', error.message);
    res.status(500).json({ message: 'Profile update failed' });
  }
});

// Get user profile
app.get('/api/profile', authenticateToken, async (req, res) => {
  if (!pool) {
    return res.status(500).json({ 
      message: 'Database not connected. Please check server logs.' 
    });
  }

  try {
    const userId = req.user.userId;
    
    const [users] = await pool.execute(
      'SELECT id, name, email, company_name, profile_picture, role, created_at FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user: users[0] });
  } catch (error) {
    console.error('❌ Get profile error:', error.message);
    res.status(500).json({ message: 'Error fetching profile' });
  }
});

// Activity logs routes
app.get('/api/activity-logs', authenticateToken, async (req, res) => {
  if (!pool) {
    return res.status(500).json({ 
      message: 'Database not connected. Please check server logs.' 
    });
  }

  try {
    const { limit = 50, type, user_id, product_id } = req.query;
    let query = `
      SELECT al.*, u.name as user_name, p.name as product_name
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      LEFT JOIN products p ON al.product_id = p.id
      WHERE 1=1
    `;
    const params = [];

    if (type) {
      query += ' AND al.type = ?';
      params.push(type);
    }
    if (user_id) {
      query += ' AND al.user_id = ?';
      params.push(user_id);
    }
    if (product_id) {
      query += ' AND al.product_id = ?';
      params.push(product_id);
    }

    query += ' ORDER BY al.created_at DESC LIMIT ?';
    params.push(parseInt(limit));

    const [logs] = await pool.execute(query, params);
    res.json(logs);
  } catch (error) {
    console.error('❌ Get activity logs error:', error.message);
    res.status(500).json({ message: 'Error fetching activity logs' });
  }
});

// Inventory transactions routes
app.get('/api/inventory-transactions', authenticateToken, async (req, res) => {
  if (!pool) {
    return res.status(500).json({ 
      message: 'Database not connected. Please check server logs.' 
    });
  }

  try {
    const { 
      limit = 50, 
      type, 
      user_id, 
      product_id, 
      start_date, 
      end_date,
      page = 1 
    } = req.query;
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let query = `
      SELECT it.*, 
             u.name as user_name,
             p.name as product_name,
             p.sku as product_sku
      FROM inventory_transactions it
      LEFT JOIN users u ON it.user_id = u.id
      LEFT JOIN products p ON it.product_id = p.id
      WHERE 1=1
    `;
    
    let countQuery = `
      SELECT COUNT(*) as total
      FROM inventory_transactions it
      WHERE 1=1
    `;
    
    const params = [];
    const countParams = [];

    if (type) {
      query += ' AND it.type = ?';
      countQuery += ' AND it.type = ?';
      params.push(type);
      countParams.push(type);
    }
    if (user_id) {
      query += ' AND it.user_id = ?';
      countQuery += ' AND it.user_id = ?';
      params.push(user_id);
      countParams.push(user_id);
    }
    if (product_id) {
      query += ' AND it.product_id = ?';
      countQuery += ' AND it.product_id = ?';
      params.push(product_id);
      countParams.push(product_id);
    }
    if (start_date) {
      query += ' AND DATE(it.created_at) >= ?';
      countQuery += ' AND DATE(it.created_at) >= ?';
      params.push(start_date);
      countParams.push(start_date);
    }
    if (end_date) {
      query += ' AND DATE(it.created_at) <= ?';
      countQuery += ' AND DATE(it.created_at) <= ?';
      params.push(end_date);
      countParams.push(end_date);
    }

    query += ' ORDER BY it.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [transactions] = await pool.execute(query, params);
    const [countResult] = await pool.execute(countQuery, countParams);
    
    const total = countResult[0].total;
    const totalPages = Math.ceil(total / parseInt(limit));
    
    res.json({
      transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages
      }
    });
  } catch (error) {
    console.error('❌ Get inventory transactions error:', error.message);
    res.status(500).json({ message: 'Error fetching inventory transactions' });
  }
});

// Add manual stock adjustment
app.post('/api/products/:id/adjust-stock', authenticateToken, async (req, res) => {
  if (!pool) {
    return res.status(500).json({ 
      message: 'Database not connected. Please check server logs.' 
    });
  }

  try {
    const { id } = req.params;
    const { quantity, type, notes } = req.body;
    const userId = req.user.userId;

    if (!quantity || !type) {
      return res.status(400).json({ 
        message: 'Quantity and type are required' 
      });
    }

    const quantityNum = parseFloat(quantity);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      return res.status(400).json({ 
        message: 'Quantity must be a positive number' 
      });
    }

    // Get current product
    const [products] = await pool.execute(
      'SELECT * FROM products WHERE id = ?',
      [id]
    );

    if (products.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const product = products[0];
    const currentStock = product.stock;
    let newStock;

    // Calculate new stock based on type
    if (type === 'IN') {
      newStock = currentStock + quantityNum;
    } else if (type === 'OUT') {
      if (quantityNum > currentStock) {
        return res.status(400).json({ 
          message: `Cannot remove ${quantityNum} units. Only ${currentStock} available.` 
        });
      }
      newStock = currentStock - quantityNum;
    } else if (type === 'ADJUST') {
      newStock = quantityNum;
    } else {
      return res.status(400).json({ 
        message: 'Invalid type. Must be IN, OUT, or ADJUST.' 
      });
    }

    // Update product stock
    await pool.execute(
      'UPDATE products SET stock = ? WHERE id = ?',
      [newStock, id]
    );

    // Log inventory transaction
    await logInventoryTransaction(
      id,
      userId,
      type,
      quantityNum,
      currentStock,
      newStock,
      'MANUAL_ADJUSTMENT',
      notes
    );

    // Log activity
    await logActivity(
      'STOCK_ADJUSTED',
      `Stock ${type.toLowerCase()} for "${product.name}": ${currentStock} → ${newStock} (Δ: ${quantityNum})`,
      userId,
      id
    );

    // Get updated product
    const [updatedProduct] = await pool.execute(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.id = ?
    `, [id]);

    res.json({
      message: `Stock ${type.toLowerCase()} successful`,
      product: updatedProduct[0],
      transaction: {
        type,
        quantity: quantityNum,
        previousStock: currentStock,
        newStock,
        notes
      }
    });
  } catch (error) {
    console.error('❌ Adjust stock error:', error.message);
    res.status(500).json({ message: 'Error adjusting stock' });
  }
});

// Get product transaction history
app.get('/api/products/:id/transactions', authenticateToken, async (req, res) => {
  if (!pool) {
    return res.status(500).json({ 
      message: 'Database not connected. Please check server logs.' 
    });
  }

  try {
    const { id } = req.params;
    const { limit = 20 } = req.query;

    const [transactions] = await pool.execute(`
      SELECT it.*, u.name as user_name
      FROM inventory_transactions it
      LEFT JOIN users u ON it.user_id = u.id
      WHERE it.product_id = ?
      ORDER BY it.created_at DESC
      LIMIT ?
    `, [id, parseInt(limit)]);

    res.json(transactions);
  } catch (error) {
    console.error('❌ Get product transactions error:', error.message);
    res.status(500).json({ message: 'Error fetching product transactions' });
  }
});

// Products routes
app.get('/api/products', authenticateToken, async (req, res) => {
  if (!pool) {
    return res.status(500).json({ 
      message: 'Database not connected. Please check server logs.' 
    });
  }

  try {
    const [products] = await pool.execute(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      ORDER BY p.created_at DESC
    `);
    res.json(products);
  } catch (error) {
    console.error('❌ Get products error:', error.message);
    res.status(500).json({ message: 'Error fetching products' });
  }
});

app.post('/api/products', authenticateToken, async (req, res) => {
  if (!pool) {
    return res.status(500).json({ 
      message: 'Database not connected. Please check server logs.' 
    });
  }

  try {
    const { name, description, sku, price, stock, min_stock, category_id } = req.body;
    const userId = req.user.userId;
    
    if (!name || !sku || !price) {
      return res.status(400).json({ message: 'Name, SKU, and price are required' });
    }

    const initialStock = stock || 0;
    
    const [result] = await pool.execute(
      'INSERT INTO products (name, description, sku, price, stock, min_stock, category_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, description, sku, price, initialStock, min_stock || 5, category_id || null]
    );
    
    const [newProduct] = await pool.execute(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.id = ?
    `, [result.insertId]);
    
    // Log inventory transaction for initial stock
    if (initialStock > 0) {
      await logInventoryTransaction(
        result.insertId,
        userId,
        'IN',
        initialStock,
        0,
        initialStock,
        'INITIAL_STOCK',
        'Initial stock when product was created'
      );
    }
    
    // Log the activity
    await logActivity(
      'PRODUCT_CREATED',
      `Product "${name}" (SKU: ${sku}) created with initial stock: ${initialStock}`,
      userId,
      result.insertId
    );
    
    res.status(201).json(newProduct[0]);
  } catch (error) {
    console.error('❌ Create product error:', error.message);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'SKU already exists' });
    }
    
    res.status(500).json({ message: 'Error creating product' });
  }
});

app.put('/api/products/:id', authenticateToken, async (req, res) => {
  if (!pool) {
    return res.status(500).json({ 
      message: 'Database not connected. Please check server logs.' 
    });
  }

  try {
    const { id } = req.params;
    const { name, description, sku, price, stock, min_stock, category_id } = req.body;
    const userId = req.user.userId;

    // Get current stock and name for comparison and logging
    const [currentProduct] = await pool.execute(
      'SELECT stock, name, sku FROM products WHERE id = ?',
      [id]
    );
    
    const currentStock = currentProduct[0]?.stock || 0;
    const productName = currentProduct[0]?.name || '';
    const productSKU = currentProduct[0]?.sku || '';
    
    await pool.execute(
      'UPDATE products SET name = ?, description = ?, sku = ?, price = ?, stock = ?, min_stock = ?, category_id = ? WHERE id = ?',
      [name, description, sku, price, stock, min_stock, category_id, id]
    );
    
    // Log stock change if stock was updated
    if (stock !== undefined && stock != currentStock) {
      const changeAmount = stock - currentStock;
      const changeType = changeAmount > 0 ? 'ADJUST' : 'ADJUST';
      
      await logInventoryTransaction(
        id,
        userId,
        changeType,
        Math.abs(changeAmount),
        currentStock,
        stock,
        'STOCK_UPDATE',
        'Stock updated via product edit'
      );
      
      const activityType = changeAmount > 0 ? 'STOCK_INCREASED' : 'STOCK_DECREASED';
      await logActivity(
        activityType,
        `Stock for "${productName}" (${productSKU}) changed from ${currentStock} to ${stock} (Δ: ${Math.abs(changeAmount)})`,
        userId,
        id
      );
    } else {
      // Log general product update if no stock change
      await logActivity(
        'PRODUCT_UPDATED',
        `Product "${productName}" (${productSKU}) details updated`,
        userId,
        id
      );
    }
    
    const [updatedProduct] = await pool.execute(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.id = ?
    `, [id]);
    
    res.json(updatedProduct[0]);
  } catch (error) {
    console.error('❌ Update product error:', error.message);
    res.status(500).json({ message: 'Error updating product' });
  }
});

app.delete('/api/products/:id', authenticateToken, async (req, res) => {
  if (!pool) {
    return res.status(500).json({ 
      message: 'Database not connected. Please check server logs.' 
    });
  }

  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    // Get product info for logging before deletion
    const [product] = await pool.execute(
      'SELECT name, sku FROM products WHERE id = ?',
      [id]
    );
    
    const productName = product[0]?.name || '';
    const productSKU = product[0]?.sku || '';
    
    await pool.execute('DELETE FROM products WHERE id = ?', [id]);
    
    // Log deletion activity
    await logActivity(
      'PRODUCT_DELETED',
      `Product "${productName}" (${productSKU}) deleted`,
      userId
    );
    
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('❌ Delete product error:', error.message);
    res.status(500).json({ message: 'Error deleting product' });
  }
});

// Categories routes
app.get('/api/categories', authenticateToken, async (req, res) => {
  if (!pool) {
    return res.status(500).json({ 
      message: 'Database not connected. Please check server logs.' 
    });
  }

  try {
    const [categories] = await pool.execute(`
      SELECT c.*, COUNT(p.id) as product_count 
      FROM categories c 
      LEFT JOIN products p ON c.id = p.category_id 
      GROUP BY c.id 
      ORDER BY c.name
    `);
    res.json(categories);
  } catch (error) {
    console.error('❌ Get categories error:', error.message);
    res.status(500).json({ message: 'Error fetching categories' });
  }
});

app.post('/api/categories', authenticateToken, async (req, res) => {
  if (!pool) {
    return res.status(500).json({ 
      message: 'Database not connected. Please check server logs.' 
    });
  }

  try {
    const { name, description } = req.body;
    const userId = req.user.userId;
    
    console.log('Creating category:', { name, description });
    
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    const [result] = await pool.execute(
      'INSERT INTO categories (name, description) VALUES (?, ?)',
      [name.trim(), description?.trim() || '']
    );
    
    const [newCategory] = await pool.execute(
      'SELECT *, 0 as product_count FROM categories WHERE id = ?',
      [result.insertId]
    );
    
    console.log('✅ Category created successfully:', newCategory[0].id);
    
    // Log category creation
    await logActivity(
      'CATEGORY_CREATED',
      `Category "${name}" created`,
      userId
    );
    
    res.status(201).json(newCategory[0]);
  } catch (error) {
    console.error('❌ Create category error:', error.message);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Category name already exists' });
    }
    
    res.status(500).json({ 
      message: 'Error creating category',
      error: error.message 
    });
  }
});

app.put('/api/categories/:id', authenticateToken, async (req, res) => {
  if (!pool) {
    return res.status(500).json({ 
      message: 'Database not connected. Please check server logs.' 
    });
  }

  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const userId = req.user.userId;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Category name is required' });
    }
    
    // Get old name for logging
    const [oldCategory] = await pool.execute(
      'SELECT name FROM categories WHERE id = ?',
      [id]
    );
    const oldName = oldCategory[0]?.name || '';
    
    await pool.execute(
      'UPDATE categories SET name = ?, description = ? WHERE id = ?',
      [name.trim(), description?.trim() || '', id]
    );
    
    const [updatedCategory] = await pool.execute(
      'SELECT *, 0 as product_count FROM categories WHERE id = ?',
      [id]
    );
    
    // Log category update
    if (oldName !== name.trim()) {
      await logActivity(
        'CATEGORY_UPDATED',
        `Category renamed from "${oldName}" to "${name}"`,
        userId
      );
    } else {
      await logActivity(
        'CATEGORY_UPDATED',
        `Category "${name}" details updated`,
        userId
      );
    }
    
    res.json(updatedCategory[0]);
  } catch (error) {
    console.error('❌ Update category error:', error.message);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Category name already exists' });
    }
    
    res.status(500).json({ message: 'Error updating category' });
  }
});

app.delete('/api/categories/:id', authenticateToken, async (req, res) => {
  if (!pool) {
    return res.status(500).json({ 
      message: 'Database not connected. Please check server logs.' 
    });
  }

  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    // Get category info for logging
    const [category] = await pool.execute(
      'SELECT name FROM categories WHERE id = ?',
      [id]
    );
    const categoryName = category[0]?.name || '';
    
    // Check if category has products
    const [products] = await pool.execute(
      'SELECT COUNT(*) as count FROM products WHERE category_id = ?',
      [id]
    );
    
    if (products[0].count > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete category with existing products' 
      });
    }
    
    await pool.execute('DELETE FROM categories WHERE id = ?', [id]);
    
    // Log category deletion
    await logActivity(
      'CATEGORY_DELETED',
      `Category "${categoryName}" deleted`,
      userId
    );
    
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('❌ Delete category error:', error.message);
    res.status(500).json({ message: 'Error deleting category' });
  }
});

// Dashboard stats
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
  if (!pool) {
    return res.status(500).json({ 
      message: 'Database not connected. Please check server logs.' 
    });
  }

  try {
    const [products] = await pool.execute('SELECT COUNT(*) as total_products FROM products');
    const [categories] = await pool.execute('SELECT COUNT(*) as total_categories FROM categories');
    const [lowStock] = await pool.execute('SELECT COUNT(*) as low_stock FROM products WHERE stock <= min_stock AND stock > 0');
    const [outOfStock] = await pool.execute('SELECT COUNT(*) as out_of_stock FROM products WHERE stock = 0');
    const [totalValue] = await pool.execute('SELECT SUM(price * stock) as total_value FROM products');
    const [recentActivity] = await pool.execute('SELECT COUNT(*) as recent_activity FROM activity_logs WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)');
    const [todayTransactions] = await pool.execute('SELECT COUNT(*) as today_transactions FROM inventory_transactions WHERE DATE(created_at) = CURDATE()');
    const [monthlyTransactions] = await pool.execute('SELECT COUNT(*) as monthly_transactions FROM inventory_transactions WHERE MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW())');

    res.json({
      totalProducts: products[0].total_products,
      totalCategories: categories[0].total_categories,
      lowStock: lowStock[0].low_stock,
      outOfStock: outOfStock[0].out_of_stock,
      totalValue: totalValue[0].total_value || 0,
      recentActivity: recentActivity[0].recent_activity || 0,
      todayTransactions: todayTransactions[0].today_transactions || 0,
      monthlyTransactions: monthlyTransactions[0].monthly_transactions || 0
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Error fetching dashboard stats' });
  }
});

// Get low stock alerts
app.get('/api/alerts/low-stock', authenticateToken, async (req, res) => {
  if (!pool) {
    return res.status(500).json({ 
      message: 'Database not connected. Please check server logs.' 
    });
  }

  try {
    const [lowStockProducts] = await pool.execute(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.stock <= p.min_stock AND p.stock > 0 
      ORDER BY p.stock ASC
      LIMIT 10
    `);
    
    res.json(lowStockProducts);
  } catch (error) {
    console.error('Low stock alerts error:', error);
    res.status(500).json({ message: 'Error fetching low stock alerts' });
  }
});

// Get recent activities for dashboard
app.get('/api/dashboard/recent-activities', authenticateToken, async (req, res) => {
  if (!pool) {
    return res.status(500).json({ 
      message: 'Database not connected. Please check server logs.' 
    });
  }

  try {
    const [activities] = await pool.execute(`
      SELECT al.*, u.name as user_name, p.name as product_name
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      LEFT JOIN products p ON al.product_id = p.id
      ORDER BY al.created_at DESC
      LIMIT 10
    `);
    
    res.json(activities);
  } catch (error) {
    console.error('Recent activities error:', error);
    res.status(500).json({ message: 'Error fetching recent activities' });
  }
});

// Get recent transactions for dashboard
app.get('/api/dashboard/recent-transactions', authenticateToken, async (req, res) => {
  if (!pool) {
    return res.status(500).json({ 
      message: 'Database not connected. Please check server logs.' 
    });
  }

  try {
    const [transactions] = await pool.execute(`
      SELECT it.*, 
             u.name as user_name,
             p.name as product_name,
             p.sku as product_sku
      FROM inventory_transactions it
      LEFT JOIN users u ON it.user_id = u.id
      LEFT JOIN products p ON it.product_id = p.id
      ORDER BY it.created_at DESC
      LIMIT 10
    `);
    
    res.json(transactions);
  } catch (error) {
    console.error('Recent transactions error:', error);
    res.status(500).json({ message: 'Error fetching recent transactions' });
  }
});

// Get transaction summary by type
app.get('/api/dashboard/transaction-summary', authenticateToken, async (req, res) => {
  if (!pool) {
    return res.status(500).json({ 
      message: 'Database not connected. Please check server logs.' 
    });
  }

  try {
    const [summary] = await pool.execute(`
      SELECT 
        type,
        COUNT(*) as count,
        SUM(quantity) as total_quantity
      FROM inventory_transactions
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY type
      ORDER BY count DESC
    `);
    
    res.json(summary);
  } catch (error) {
    console.error('Transaction summary error:', error);
    res.status(500).json({ message: 'Error fetching transaction summary' });
  }
});

// Error handling for file uploads
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Maximum size is 5MB.' });
    }
  }
  res.status(500).json({ message: error.message });
});

app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  res.status(500).json({ 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📍 Uploads: http://localhost:${PORT}/uploads/`);
  console.log(`📍 Database: ${pool ? '✅ Connected' : '❌ Disconnected'}`);
  console.log(`📍 Using existing activity_logs table ✅`);
  console.log(`📍 Creating inventory_transactions table (6th table) ✅`);
});