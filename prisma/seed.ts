import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * Seed script — Creates a demo US restaurant for the PoC pilot test.
 * Run: npx ts-node --compiler-options '{"module":"commonjs"}' prisma/seed.ts
 * Or: npx prisma db seed
 */
async function main() {
  console.log('🌱 Seeding GetSpecial database...');

  // 1. Create demo user
  const passwordHash = await bcrypt.hash('GetSpecial2026!', 12);
  const user = await (prisma.user as any).upsert({
    where: { email: 'demo@getspecial.io' },
    update: {},
    create: {
      email: 'demo@getspecial.io',
      name: 'Alex Rivera',
      passwordHash,
    },
  });
  console.log(`✅ User created: ${user.email} (${user.id})`);

  // 2. Create pilot restaurant (Austin, TX — US market)
  const restaurant = await prisma.restaurant.create({
    data: {
      name: 'The Brass Pelican',
      type: 'restaurant',
      address: '1234 S Congress Ave, Austin, TX 78704',
      latitude: 30.2500,
      longitude: -97.7500,
      timezone: 'America/Chicago',
      specialties: ['craft cocktails', 'smoked wings', 'brunch', 'patio dining'],
      userId: user.id,
      profile: {
        create: {
          tone: 'energetic',
          hasTerrace: true,
          offPeakDays: ['monday', 'tuesday'],
          constraints: ['no peanuts', 'vegetarian options available'],
        },
      },
    },
    include: { profile: true },
  });
  console.log(`✅ Restaurant created: ${restaurant.name} (${restaurant.id})`);

  // 3. Create active offers
  const offer1 = await prisma.offer.create({
    data: {
      restaurantId: restaurant.id,
      title: 'MVP Wings & Pitcher Combo',
      description: '20 smoked wings + pitcher of local IPA for $28',
      discountValue: '$28 combo',
      recurrence: 'weekly',
      recurrenceDays: ['sunday'],
    },
  });
  const offer2 = await prisma.offer.create({
    data: {
      restaurantId: restaurant.id,
      title: 'Happy Hour Patio Special',
      description: '$6 craft cocktails and 50% off appetizers from 3–6 PM',
      discountValue: '50% off appetizers',
      recurrence: 'daily',
      recurrenceDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    },
  });
  console.log(`✅ Offers created: ${offer1.title}, ${offer2.title}`);

  // 4. Create mock social accounts
  await prisma.socialAccount.create({
    data: {
      restaurantId: restaurant.id,
      platform: 'instagram',
      outstandAccountId: 'mock_ig_brasspelican',
      username: '@thebrasspelican_atx',
      status: 'connected',
    },
  });
  await prisma.socialAccount.create({
    data: {
      restaurantId: restaurant.id,
      platform: 'facebook',
      outstandAccountId: 'mock_fb_brasspelican',
      username: 'The Brass Pelican Austin',
      status: 'connected',
    },
  });
  await prisma.socialAccount.create({
    data: {
      restaurantId: restaurant.id,
      platform: 'google_business',
      outstandAccountId: 'mock_gmb_brasspelican',
      username: 'The Brass Pelican',
      status: 'connected',
    },
  });
  console.log('✅ Social accounts created (Instagram, Facebook, Google Business)');

  // 5. Output the restaurant ID for the dashboard
  console.log('\n========================================');
  console.log(`🎯 PILOT RESTAURANT ID: ${restaurant.id}`);
  console.log('========================================');
  console.log('Set this in your browser localStorage:');
  console.log(`  localStorage.setItem('getspecial_restaurant_id', '${restaurant.id}')`);
  console.log('========================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
