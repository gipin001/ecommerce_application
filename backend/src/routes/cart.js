const router = require('express').Router();
const ctrl = require('../controllers/cartController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/', ctrl.getCart);
router.post('/', ctrl.addToCart);
router.put('/:id', ctrl.updateCart);
router.delete('/clear', ctrl.clearCart);
router.delete('/:id', ctrl.removeFromCart);

module.exports = router;
