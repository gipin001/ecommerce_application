require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const bcrypt = require('bcryptjs');
const db = require('./db');

async function seed() {
  try {
    const adminPassword = await bcrypt.hash('admin123', 10);
    const userPassword = await bcrypt.hash('user123', 10);

    await db.query(`
      INSERT INTO users (name, email, password, role) VALUES
        ('Admin User', 'admin@store.com', $1, 'admin'),
        ('Jane Doe', 'jane@example.com', $2, 'customer')
      ON CONFLICT (email) DO NOTHING;
    `, [adminPassword, userPassword]);

    await db.query(`
      INSERT INTO categories (name, slug, description) VALUES
        ('Electronics', 'electronics', 'Gadgets and devices'),
        ('Clothing', 'clothing', 'Apparel and fashion'),
        ('Books', 'books', 'Physical and digital books'),
        ('Home & Garden', 'home-garden', 'Home decor and garden supplies')
      ON CONFLICT (slug) DO NOTHING;
    `);

    const { rows: cats } = await db.query('SELECT id, slug FROM categories');
    const catMap = Object.fromEntries(cats.map(c => [c.slug, c.id]));

    await db.query(`
      INSERT INTO products (name, slug, description, price, compare_price, category_id, stock, sku, is_active) VALUES
        ('Wireless Headphones', 'wireless-headphones', 'Premium noise-cancelling headphones', 79.99, 129.99, $1, 50, 'ELEC-001', true),
        ('Mechanical Keyboard', 'mechanical-keyboard', 'RGB backlit mechanical keyboard', 59.99, 89.99, $1, 30, 'ELEC-002', true),
        ('Running Shoes', 'running-shoes', 'Lightweight running shoes', 49.99, 79.99, $2, 100, 'CLTH-001', true),
        ('Denim Jacket', 'denim-jacket', 'Classic denim jacket', 39.99, 59.99, $2, 60, 'CLTH-002', true),
        ('Clean Code', 'clean-code', 'A handbook of agile software craftsmanship', 29.99, NULL, $3, 200, 'BOOK-001', true),
        ('The Pragmatic Programmer', 'pragmatic-programmer', 'Your journey to mastery', 34.99, NULL, $3, 150, 'BOOK-002', true),
        ('Plant Pot Set', 'plant-pot-set', 'Set of 3 ceramic plant pots', 24.99, 39.99, $4, 80, 'HOME-001', true),
        ('LED Desk Lamp', 'led-desk-lamp', 'Adjustable LED desk lamp with USB charging', 34.99, 49.99, $4, 45, 'HOME-002', true)
      ON CONFLICT (slug) DO NOTHING;
    `, [catMap['electronics'], catMap['clothing'], catMap['books'], catMap['home-garden']]);

    console.log('Seed completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

seed();
