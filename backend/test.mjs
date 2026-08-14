const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function test() {
  const p = await prisma.product.findFirst();
  console.log('PRODUCT_ID:', p.id);
}
test();
