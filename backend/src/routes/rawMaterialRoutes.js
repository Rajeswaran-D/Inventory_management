const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/rawMaterialController');
const { protect, isAdmin } = require('../middleware/auth');

router.use(protect);

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', isAdmin, ctrl.create);
router.put('/:id', isAdmin, ctrl.update);
router.delete('/:id', isAdmin, ctrl.remove);
router.patch('/:id/stock', isAdmin, ctrl.updateStock);

module.exports = router;
