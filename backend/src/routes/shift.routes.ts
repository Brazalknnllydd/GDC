import { Router } from 'express';
import { ShiftController } from '../controllers/shift.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// Apply authentication to all routes
router.use(requireAuth);

// Cashier Routes
router.get('/current', ShiftController.getCurrentShift);
router.post('/', ShiftController.openShift);
router.put('/:id/close', ShiftController.closeShift);
router.get('/:id/report', ShiftController.getShiftReport);

// Admin Routes
router.get('/', requireRole(['Admin', 'Owner']), ShiftController.getAllShifts);
router.put('/:id/force-close', requireRole(['Admin', 'Owner']), ShiftController.forceCloseShift);
router.put('/:id/reopen', requireRole(['Admin', 'Owner']), ShiftController.reopenShift);

export default router;
