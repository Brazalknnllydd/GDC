import { prisma } from '../lib/prisma.js';
import { Prisma } from '@prisma/client';

function sumCompletedCashSales(sales: Array<{ paymentMethod: string; status: string; totalAmount: Prisma.Decimal }>) {
  return sales.reduce((total, sale) => {
    if (sale.paymentMethod.toLowerCase() === 'cash' && sale.status === 'completed') {
      return total.add(sale.totalAmount);
    }

    return total;
  }, new Prisma.Decimal(0));
}

function sumExpenses(expenses: Array<{ amount: Prisma.Decimal }>) {
  return expenses.reduce((total, expense) => total.add(expense.amount), new Prisma.Decimal(0));
}

function calculateExpectedCash(
  shift: {
    openingCash: Prisma.Decimal;
    sales: Array<{ paymentMethod: string; status: string; totalAmount: Prisma.Decimal }>;
    expenses: Array<{ amount: Prisma.Decimal }>;
  }
) {
  return shift.openingCash.add(sumCompletedCashSales(shift.sales)).sub(sumExpenses(shift.expenses));
}

export const ShiftService = {
  async getAllShifts() {
    return prisma.shift.findMany({
      where: {
        user: {
          role: {
            name: 'Cashier',
          },
        },
      },
      orderBy: { startedAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, username: true },
        },
        expenses: true,
        _count: {
          select: { expenses: true, sales: true },
        },
      },
    });
  },

  async getCurrentShift(userId: number) {
    return prisma.shift.findFirst({
      where: {
        userId,
        status: 'OPEN',
      },
      include: {
        expenses: true,
        _count: {
          select: { expenses: true, sales: true },
        },
      },
    });
  },

  async openShift(userId: number, openingCash: number) {
    // Check if there's already an open shift
    const existing = await this.getCurrentShift(userId);
    if (existing) {
      throw new Error('User already has an open shift.');
    }

    return prisma.shift.create({
      data: {
        userId,
        openingCash: new Prisma.Decimal(openingCash),
        status: 'OPEN',
      },
    });
  },

  async closeShift(userId: number, shiftId: number, closingCash: number) {
    const shift = await prisma.shift.findFirst({
      where: { id: shiftId, userId, status: 'OPEN' },
      include: { expenses: true, sales: true },
    });

    if (!shift) {
      throw new Error('Active shift not found.');
    }

    const expectedClosingCash = calculateExpectedCash(shift);

    if (!expectedClosingCash.equals(new Prisma.Decimal(closingCash))) {
      throw new Error(`Closing cash must match the expected amount of ${expectedClosingCash.toFixed(2)}.`);
    }

    return prisma.shift.update({
      where: { id: shiftId },
      data: {
        closingCash: new Prisma.Decimal(closingCash),
        expectedClosingCash,
        status: 'CLOSED',
        endedAt: new Date(),
      },
    });
  },

  async forceCloseShift(shiftId: number, notes?: string) {
    const shift = await prisma.shift.findUnique({
      where: { id: shiftId },
      include: { expenses: true, sales: true },
    });

    if (!shift) {
      throw new Error('Shift not found.');
    }

    const expectedClosingCash = calculateExpectedCash(shift);

    return prisma.shift.update({
      where: { id: shiftId },
      data: {
        status: 'FORCE_CLOSED',
        expectedClosingCash,
        endedAt: new Date(),
        notes: notes ?? null,
      },
    });
  },

  async reopenShift(shiftId: number, notes?: string) {
    const shift = await prisma.shift.findUnique({
      where: { id: shiftId },
    });

    if (!shift) {
      throw new Error('Shift not found.');
    }

    return prisma.shift.update({
      where: { id: shiftId },
      data: {
        status: 'OPEN',
        endedAt: null,
        notes: notes ?? null,
      },
    });
  },

  async getShiftReport(shiftId: number) {
    const shift = await prisma.shift.findUnique({
      where: { id: shiftId },
      include: {
        user: { select: { name: true } },
        sales: {
          include: {
            items: true,
          },
        },
        expenses: true,
      },
    });

    if (!shift) {
      throw new Error('Shift not found.');
    }

    return shift;
  },
};
