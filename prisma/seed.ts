import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

async function main() {
  // Create Admin User
  const existingAdmin = await prisma.user.findFirst({
    where: { email: 'admin@inventory.com' },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await prisma.user.create({
      data: {
        email: 'admin@inventory.com',
        password: hashedPassword,
        name: 'Administrator',
        isActive: true,
      },
    });
    console.log('✅ Admin user created');
    console.log('📧 Email: admin@inventory.com');
    console.log('🔑 Password: admin123');
  } else {
    console.log('ℹ️  Admin user already exists');
  }

}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
