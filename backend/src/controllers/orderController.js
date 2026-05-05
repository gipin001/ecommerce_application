const db = require('../config/db');

exports.createOrder = async (req, res) => {
  const { shipping_address, payment_method = 'card', notes } = req.body;
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const { rows: cartItems } = await client.query(`
      SELECT c.quantity, p.id AS product_id, p.name, p.price, p.image, p.stock
      FROM cart c JOIN products p ON c.product_id = p.id
      WHERE c.user_id = $1 AND p.is_active = true
    `, [req.user.id]);

    if (!cartItems.length) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Cart is empty' });
    }

    for (const item of cartItems) {
      if (item.stock < item.quantity) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `Insufficient stock for ${item.name}` });
      }
    }

    const subtotal = cartItems.reduce((sum, i) => sum + parseFloat(i.price) * i.quantity, 0);
    const tax = subtotal * 0.1;
    const shipping = subtotal > 50 ? 0 : 5.99;
    const total = subtotal + tax + shipping;

    const { rows: [order] } = await client.query(`
      INSERT INTO orders (user_id, status, total, subtotal, tax, shipping, shipping_address, payment_method, notes)
      VALUES ($1, 'pending', $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [req.user.id, total.toFixed(2), subtotal.toFixed(2), tax.toFixed(2), shipping.toFixed(2),
        JSON.stringify(shipping_address), payment_method, notes]);

    for (const item of cartItems) {
      await client.query(`
        INSERT INTO order_items (order_id, product_id, name, price, quantity, image)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [order.id, item.product_id, item.name, item.price, item.quantity, item.image]);

      await client.query(
        'UPDATE products SET stock = stock - $1 WHERE id = $2',
        [item.quantity, item.product_id]
      );
    }

    await client.query('DELETE FROM cart WHERE user_id = $1', [req.user.id]);
    await client.query('COMMIT');

    res.status(201).json({ order: { ...order, items: cartItems } });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Order creation failed' });
  } finally {
    client.release();
  }
};

exports.getOrders = async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT o.*, json_agg(json_build_object(
        'id', oi.id, 'name', oi.name, 'price', oi.price, 'quantity', oi.quantity, 'image', oi.image
      )) AS items
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      WHERE o.user_id = $1
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `, [req.user.id]);
    res.json({ orders: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

exports.getOrder = async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT o.*, json_agg(json_build_object(
        'id', oi.id, 'name', oi.name, 'price', oi.price, 'quantity', oi.quantity, 'image', oi.image, 'product_id', oi.product_id
      )) AS items
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      WHERE o.id = $1 AND o.user_id = $2
      GROUP BY o.id
    `, [req.params.id, req.user.id]);

    if (!rows[0]) return res.status(404).json({ error: 'Order not found' });
    res.json({ order: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
};

// Admin
exports.getAllOrders = async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const offset = (page - 1) * limit;
  const params = [];
  const conditions = [];

  if (status) {
    params.push(status);
    conditions.push(`o.status = $${params.length}`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    params.push(parseInt(limit), offset);
    const { rows } = await db.query(`
      SELECT o.*, u.name AS user_name, u.email AS user_email,
        COUNT(oi.id) AS item_count
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON oi.order_id = o.id
      ${where}
      GROUP BY o.id, u.name, u.email
      ORDER BY o.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `, params);
    res.json({ orders: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

exports.updateOrderStatus = async (req, res) => {
  const { status } = req.body;
  try {
    const { rows } = await db.query(
      'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Order not found' });
    res.json({ order: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update order' });
  }
};
