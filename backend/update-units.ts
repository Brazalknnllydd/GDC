import { prisma } from './src/lib/prisma.js';

async function main() {
  const result = await prisma.product.updateMany({
    where: { unit: 'kg' },
    data: { unit: 'pcs' },
  });
  console.log(`Updated ${result.count} products from kg to pcs`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
