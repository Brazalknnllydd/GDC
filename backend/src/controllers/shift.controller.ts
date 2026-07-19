import type { Request, Response } from 'express';
import { ShiftService } from '../services/shift.service.js';
import type { AuthenticatedRequest } from '../types/express.js';

export const ShiftController = {
  async getAllShifts(req: Request, res: Response) {
    try {
      const shifts = await ShiftService.getAllShifts();
      res.json(shifts);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async getCurrentShift(req: Request, res: Response) {
    try {
      const userId = (req as AuthenticatedRequest).authUser?.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const shift = await ShiftService.getCurrentShift(userId);
      res.json(shift || null);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async openShift(req: Request, res: Response) {
    try {
      const userId = (req as AuthenticatedRequest).authUser?.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const { openingCash } = req.body;
      if (typeof openingCash !== 'number') {
        return res.status(400).json({ error: 'openingCash is required and must be a number' });
      }

      const shift = await ShiftService.openShift(userId, openingCash);
      res.json(shift);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async closeShift(req: Request, res: Response) {
    try {
      const userId = (req as AuthenticatedRequest).authUser?.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const shiftId = Number(req.params.id);
      const { closingCash } = req.body;
      if (typeof closingCash !== 'number') {
        return res.status(400).json({ error: 'closingCash is required and must be a number' });
      }

      const shift = await ShiftService.closeShift(userId, shiftId, closingCash);
      res.json(shift);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async forceCloseShift(req: Request, res: Response) {
    try {
      const shiftId = Number(req.params.id);
      const { notes } = req.body;
      const shift = await ShiftService.forceCloseShift(shiftId, notes);
      res.json(shift);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async reopenShift(req: Request, res: Response) {
    try {
      const shiftId = Number(req.params.id);
      const { notes } = req.body;
      const shift = await ShiftService.reopenShift(shiftId, notes);
      res.json(shift);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async getShiftReport(req: Request, res: Response) {
    try {
      const shiftId = Number(req.params.id);
      const report = await ShiftService.getShiftReport(shiftId);
      res.json(report);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  },
};
