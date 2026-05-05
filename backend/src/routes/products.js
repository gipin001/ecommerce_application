const router = require('express').Router();
const ctrl = require('../controllers/productController');
const reviewCtrl = require('../controllers/reviewController');
const { authenticate, requireAdmin, optionalAuth } = require('../middleware/auth');

router.get('/', ctrl.getProducts);
router.get('/categories', ctrl.getCategories);
router.get('/:id', optionalAuth, ctrl.getProduct);

router.post('/', authenticate, requireAdmin, ctrl.createProduct);
router.put('/:id', authenticate, requireAdmin, ctrl.updateProduct);
router.delete('/:id', authenticate, requireAdmin, ctrl.deleteProduct);

router.post('/:product_id/reviews', authenticate, reviewCtrl.addReview);
router.delete('/reviews/:id', authenticate, reviewCtrl.deleteReview);

module.exports = router;
