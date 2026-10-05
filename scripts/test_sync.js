const { signalSyncScheduler } = require('./src/server/modules/signal-collector/signal-sync.scheduler.ts');
const { prisma } = require('./src/server/db/prisma.client.ts');

async function testSync() {
  try {
    const res = await signalSyncScheduler.syncSignalsForRestaurant('cmuo5dxij0001bczgykw7yigq');
    console.log('Sync result count:', res.length);
    console.log('Signals:', JSON.stringify(res, null, 2));
  } catch (e) {
    console.error('Sync failed:', e);
  }
}

testSync().finally(() => prisma.$disconnect());
