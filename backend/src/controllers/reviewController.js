const db = require('../config/db');

exports.addReview = async (req, res) => {
  const { rating, title, body } = req.body;
  const { product_id } = req.params;
  try {
    const { rows } = await db.query(`
      INSERT INTO reviews (user_id, product_id, rating, title, body)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id, product_id) DO UPDATE SET rating=$3, title=$4, body=$5
      RETURNING *
    `, [req.user.id, product_id, rating, title, body]);

    await db.query(`
      UPDATE products SET
        rating = (SELECT AVG(rating) FROM reviews WHERE product_id = $1),
        review_count = (SELECT COUNT(*) FROM reviews WHERE product_id = $1)
      WHERE id = $1
    `, [product_id]);

    res.status(201).json({ review: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add review' });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    await db.query('DELETE FROM reviews WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    res.json({ message: 'Review deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete review' });
  }
};
