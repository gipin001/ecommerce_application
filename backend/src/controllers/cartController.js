const db = require('../config/db');

const getCartQuery = `
  SELECT c.id, c.quantity, c.product_id,
    p.name, p.price, p.image, p.stock, p.is_active,
    (p.price * c.quantity) AS line_total
  FROM cart c
  JOIN products p ON c.product_id = p.id
  WHERE c.user_id = $1
  ORDER BY c.created_at DESC
`;

exports.getCart = async (req, res) => {
  try {
    const { rows } = await db.query(getCartQuery, [req.user.id]);
    const total = rows.reduce((sum, item) => sum + parseFloat(item.line_total), 0);
    res.json({ items: rows, total: total.toFixed(2), count: rows.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get cart' });
  }
};

exports.addToCart = async (req, res) => {
  const { product_id, quantity = 1 } = req.body;
  try {
    const { rows: product } = await db.query(
      'SELECT id, stock, is_active FROM products WHERE id = $1',
      [product_id]
    );
    if (!product[0] || !product[0].is_active) {
      return res.status(404).json({ error: 'Product not found' });
    }
    if (product[0].stock < quantity) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }

    await db.query(`
      INSERT INTO cart (user_id, product_id, quantity)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, product_id)
      DO UPDATE SET quantity = cart.quantity + $3, updated_at = NOW()
    `, [req.user.id, product_id, quantity]);

    const { rows } = await db.query(getCartQuery, [req.user.id]);
    const total = rows.reduce((sum, item) => sum + parseFloat(item.line_total), 0);
    res.json({ items: rows, total: total.toFixed(2), count: rows.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add to cart' });
  }
};

exports.updateCart = async (req, res) => {
  const { quantity } = req.body;
  try {
    if (quantity < 1) {
      await db.query('DELETE FROM cart WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    } else {
      await db.query(
        'UPDATE cart SET quantity = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3',
        [quantity, req.params.id, req.user.id]
      );
    }
    const { rows } = await db.query(getCartQuery, [req.user.id]);
    const total = rows.reduce((sum, item) => sum + parseFloat(item.line_total), 0);
    res.json({ items: rows, total: total.toFixed(2), count: rows.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update cart' });
  }
};

exports.removeFromCart = async (req, res) => {
  try {
    await db.query('DELETE FROM cart WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    const { rows } = await db.query(getCartQuery, [req.user.id]);
    const total = rows.reduce((sum, item) => sum + parseFloat(item.line_total), 0);
    res.json({ items: rows, total: total.toFixed(2), count: rows.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove item' });
  }
};

exports.clearCart = async (req, res) => {
  try {
    await db.query('DELETE FROM cart WHERE user_id = $1', [req.user.id]);
    res.json({ items: [], total: '0.00', count: 0 });
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear cart' });
  }
};
