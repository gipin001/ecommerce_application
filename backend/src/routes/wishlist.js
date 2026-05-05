const router = require('express').Router();
const ctrl = require('../controllers/wishlistController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/', ctrl.getWishlist);
router.post('/toggle', ctrl.toggleWishlist);

module.exports = router;
