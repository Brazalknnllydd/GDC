import { prisma } from './src/lib/prisma.js';

function getStartOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function getStartOfTomorrow() {
  const startOfToday = getStartOfToday();
  return new Date(
    startOfToday.getFullYear(),
    startOfToday.getMonth(),
    startOfToday.getDate() + 1
  );
}

async function run() {
  const today = await prisma.sale.count({
    where: {
      createdAt: {
        gte: getStartOfToday(),
        lt: getStartOfTomorrow()
      }
    }
  });
  console.log('Today sales count in DB:', today);
}
run();
