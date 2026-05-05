const router = require('express').Router();
const ctrl = require('../controllers/orderController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.use(authenticate);
router.post('/', ctrl.createOrder);
router.get('/', ctrl.getOrders);
router.get('/:id', ctrl.getOrder);

router.get('/admin/all', requireAdmin, ctrl.getAllOrders);
router.put('/admin/:id/status', requireAdmin, ctrl.updateOrderStatus);

module.exports = router;
