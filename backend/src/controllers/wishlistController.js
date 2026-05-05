const db = require('../config/db');

exports.getWishlist = async (req, res) => {
  const { rows } = await db.query(`
    SELECT w.id, w.created_at, p.id AS product_id, p.name, p.price, p.image, p.slug
    FROM wishlists w JOIN products p ON w.product_id = p.id
    WHERE w.user_id = $1 ORDER BY w.created_at DESC
  `, [req.user.id]);
  res.json({ items: rows });
};

exports.toggleWishlist = async (req, res) => {
  const { product_id } = req.body;
  const existing = await db.query(
    'SELECT id FROM wishlists WHERE user_id = $1 AND product_id = $2',
    [req.user.id, product_id]
  );
  if (existing.rows[0]) {
    await db.query('DELETE FROM wishlists WHERE id = $1', [existing.rows[0].id]);
    return res.json({ wishlisted: false });
  }
  await db.query('INSERT INTO wishlists (user_id, product_id) VALUES ($1, $2)', [req.user.id, product_id]);
  res.json({ wishlisted: true });
};
