const db = require('../config/db');

exports.getDashboard = async (req, res) => {
  try {
    const [users, products, orders, revenue] = await Promise.all([
      db.query('SELECT COUNT(*) FROM users WHERE role = $1', ['customer']),
      db.query('SELECT COUNT(*) FROM products WHERE is_active = true'),
      db.query('SELECT COUNT(*) FROM orders'),
      db.query("SELECT COALESCE(SUM(total), 0) AS total FROM orders WHERE status NOT IN ('cancelled','refunded')"),
    ]);

    const { rows: recentOrders } = await db.query(`
      SELECT o.id, o.status, o.total, o.created_at, u.name AS user_name
      FROM orders o LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC LIMIT 10
    `);

    const { rows: topProducts } = await db.query(`
      SELECT p.name, p.price, SUM(oi.quantity) AS units_sold
      FROM order_items oi JOIN products p ON oi.product_id = p.id
      GROUP BY p.id ORDER BY units_sold DESC LIMIT 5
    `);

    res.json({
      stats: {
        users: parseInt(users.rows[0].count),
        products: parseInt(products.rows[0].count),
        orders: parseInt(orders.rows[0].count),
        revenue: parseFloat(revenue.rows[0].total),
      },
      recentOrders,
      topProducts,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
};

exports.getUsers = async (req, res) => {
  const { page = 1, limit = 20, search } = req.query;
  const offset = (page - 1) * limit;
  const params = [];
  const conditions = [];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(name ILIKE $${params.length} OR email ILIKE $${params.length})`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    params.push(parseInt(limit), offset);
    const { rows } = await db.query(`
      SELECT id, name, email, role, created_at FROM users ${where}
      ORDER BY created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `, params);
    res.json({ users: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

exports.updateUserRole = async (req, res) => {
  const { role } = req.body;
  try {
    const { rows } = await db.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role',
      [role, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json({ user: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update role' });
  }
};
