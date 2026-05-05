const db = require('../config/db');

const slugify = (text) =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

exports.getProducts = async (req, res) => {
  const { page = 1, limit = 12, category, search, minPrice, maxPrice, sort = 'created_at' } = req.query;
  const offset = (page - 1) * limit;
  const params = [];
  const conditions = ['p.is_active = true'];

  if (category) {
    params.push(category);
    conditions.push(`c.slug = $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(p.name ILIKE $${params.length} OR p.description ILIKE $${params.length})`);
  }
  if (minPrice) {
    params.push(parseFloat(minPrice));
    conditions.push(`p.price >= $${params.length}`);
  }
  if (maxPrice) {
    params.push(parseFloat(maxPrice));
    conditions.push(`p.price <= $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const orderMap = {
    created_at: 'p.created_at DESC',
    price_asc: 'p.price ASC',
    price_desc: 'p.price DESC',
    rating: 'p.rating DESC',
  };
  const orderBy = orderMap[sort] || 'p.created_at DESC';

  try {
    params.push(parseInt(limit), offset);
    const { rows } = await db.query(`
      SELECT p.*, c.name AS category_name, c.slug AS category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ${where}
      ORDER BY ${orderBy}
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `, params);

    const countParams = params.slice(0, -2);
    const { rows: countRows } = await db.query(`
      SELECT COUNT(*) FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ${where}
    `, countParams);

    res.json({
      products: rows,
      total: parseInt(countRows[0].count),
      page: parseInt(page),
      pages: Math.ceil(countRows[0].count / limit),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

exports.getProduct = async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT p.*, c.name AS category_name, c.slug AS category_slug,
        json_agg(json_build_object('id', r.id, 'rating', r.rating, 'title', r.title, 'body', r.body, 'user_name', u.name, 'created_at', r.created_at)) FILTER (WHERE r.id IS NOT NULL) AS reviews
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN reviews r ON r.product_id = p.id
      LEFT JOIN users u ON r.user_id = u.id
      WHERE p.slug = $1 OR p.id::text = $1
      GROUP BY p.id, c.name, c.slug
    `, [req.params.id]);

    if (!rows[0]) return res.status(404).json({ error: 'Product not found' });
    res.json({ product: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
};

exports.createProduct = async (req, res) => {
  const { name, description, price, compare_price, category_id, stock, sku, image, images } = req.body;
  const slug = slugify(name) + '-' + Date.now();
  try {
    const { rows } = await db.query(`
      INSERT INTO products (name, slug, description, price, compare_price, category_id, stock, sku, image, images, vendor_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [name, slug, description, price, compare_price, category_id, stock || 0, sku, image, JSON.stringify(images || []), req.user.id]);
    res.status(201).json({ product: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create product' });
  }
};

exports.updateProduct = async (req, res) => {
  const { name, description, price, compare_price, category_id, stock, sku, image, images, is_active } = req.body;
  try {
    const { rows } = await db.query(`
      UPDATE products SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        price = COALESCE($3, price),
        compare_price = $4,
        category_id = COALESCE($5, category_id),
        stock = COALESCE($6, stock),
        sku = COALESCE($7, sku),
        image = COALESCE($8, image),
        images = COALESCE($9, images),
        is_active = COALESCE($10, is_active),
        updated_at = NOW()
      WHERE id = $11
      RETURNING *
    `, [name, description, price, compare_price, category_id, stock, sku, image, images ? JSON.stringify(images) : null, is_active, req.params.id]);

    if (!rows[0]) return res.status(404).json({ error: 'Product not found' });
    res.json({ product: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update product' });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    await db.query('UPDATE products SET is_active = false WHERE id = $1', [req.params.id]);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT c.*, COUNT(p.id) AS product_count
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id AND p.is_active = true
      GROUP BY c.id ORDER BY c.name
    `);
    res.json({ categories: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};
