import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding VÍNCULO database...');

  // Create demo aliado
  const passwordHash = await bcrypt.hash('Demo2026!', 12);

  const aliado = await prisma.aliado.upsert({
    where: { email: 'demo@fintech.co' },
    update: {},
    create: {
      email: 'demo@fintech.co',
      passwordHash,
      companyName: 'FinTech Demo SAS',
      nit: '900999999-1',
      type: 'FINTECH',
      status: 'ACTIVE',
      contactName: 'Demo User',
      contactPhone: '+57 310 0000000',
      apps: {
        create: {
          name: 'FinTech Demo - Sandbox',
          clientSecret: uuidv4(),
          sandbox: true,
        },
      },
    },
    include: { apps: true },
  });

  console.log(`✅ Demo aliado created: ${aliado.email}`);
  console.log(`   Client ID: ${aliado.apps[0]?.clientId}`);

  // Create some API call records for analytics
  const endpoints = [
    { endpoint: '/v3/vinculo/cotizacion/vida', method: 'POST' },
    { endpoint: '/v3/vinculo/cotizacion/auto', method: 'POST' },
    { endpoint: '/v3/vinculo/emision/vida', method: 'POST' },
    { endpoint: '/v3/vinculo/poliza/abc-123', method: 'GET' },
    { endpoint: '/v3/vinculo/siniestro/reportar', method: 'POST' },
  ];

  for (let i = 0; i < 50; i++) {
    const ep = endpoints[Math.floor(Math.random() * endpoints.length)];
    await prisma.apiCall.create({
      data: {
        endpoint: ep.endpoint,
        method: ep.method,
        statusCode: Math.random() > 0.05 ? 200 : 500,
        latencyMs: Math.floor(Math.random() * 150) + 20,
        aliadoId: aliado.id,
        appId: aliado.apps[0].id,
      },
    });
  }

  console.log('✅ 50 sample API calls created');
  console.log('');
  console.log('🔐 Demo credentials:');
  console.log('   Email: demo@fintech.co');
  console.log('   Password: Demo2026!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
