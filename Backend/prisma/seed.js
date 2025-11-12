const bcrypt = require('bcrypt');
const prisma = require('../src/prismaClient');

async function upsertUser(email, name, plainPassword, role = 'user') {
  const hashed = await bcrypt.hash(plainPassword, 10);
  await prisma.user.upsert({
    where: { email },
    update: { passwordHash: hashed, name, role },
    create: { email, passwordHash: hashed, name, role }
  });
  console.log(`Upserted ${email}`);
}

async function main() {
  try {
    await upsertUser('eduardo.zirbell@example.com', 'Eduardo Zirbell', 'dudugay');
    await upsertUser('guilherme.kuhnen@example.com', 'Guilherme Kuhnen', 'kunhen123');
    await upsertUser('lucas.testoni@example.com', 'Lucas Eduardo Testoni', 'testoni123');
    await upsertUser('admin@example.com', 'Admin', 'admin@123', 'admin');

    console.log('Seeding finished.');
  } catch (e) {
    console.error('Seeding error', e);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
