const net = require('net');

const regions = [
  'eu-west-3',
  'eu-central-1',
  'eu-west-1',
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'ap-southeast-1',
  'ap-northeast-1',
  'ca-central-1',
];

const tenant = 'postgres.uiijdktqnulkipwspxjh';

async function testRegion(region) {
  return new Promise((resolve) => {
    const host = `aws-0-${region}.pooler.supabase.com`;
    const client = net.createConnection({ host, port: 6543, timeout: 4000 }, () => {
      // Build PostgreSQL SSLRequest packet
      const sslPacket = Buffer.from([0x00, 0x00, 0x00, 0x08, 0x04, 0xd2, 0x16, 0x2f]);
      client.write(sslPacket);
    });

    client.on('data', (data) => {
      const response = data.toString('utf8');
      client.destroy();
      resolve({ region, host, response });
    });

    client.on('error', (err) => {
      resolve({ region, host, error: err.message });
    });

    client.on('timeout', () => {
      client.destroy();
      resolve({ region, host, error: 'TIMEOUT' });
    });
  });
}

async function findCorrectPooler() {
  console.log('Searching for correct Supabase pooler region for:', tenant);
  // Send startup message with username to see server error
  for (const reg of regions) {
    const host = `aws-0-${reg}.pooler.supabase.com`;
    await new Promise((res) => {
      const client = net.createConnection({ host, port: 6543, timeout: 3500 }, () => {
        // StartupMessage: length (4 bytes), version 3.0 (4 bytes), user\0postgres.uiijdktqnulkipwspxjh\0database\0postgres\0\0
        const params = `user\0${tenant}\0database\0postgres\0\0`;
        const len = 4 + 4 + Buffer.byteLength(params);
        const buf = Buffer.alloc(len);
        buf.writeInt32BE(len, 0);
        buf.writeInt32BE(196608, 4); // protocol 3.0
        buf.write(params, 8);
        client.write(buf);
      });

      client.on('data', (d) => {
        const text = d.toString('utf8');
        if (text.includes('tenant') && text.includes('not found')) {
          console.log(`  [${reg}] Tenant NOT found`);
        } else if (text.includes('password') || text.includes('Authentication') || d[0] === 0x52) {
          console.log(`\n🎉 TROUVÉ ! La région réelle du projet Supabase est : [${reg}] !`);
          console.log(`   Host : ${host}`);
        } else {
          console.log(`  [${reg}] Response:`, text.slice(0, 80));
        }
        client.destroy();
        res();
      });

      client.on('error', () => res());
      client.on('timeout', () => {
        client.destroy();
        res();
      });
    });
  }
}

findCorrectPooler();
