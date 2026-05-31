import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create Egypt workspace
  const egyptWorkspace = await prisma.workspace.upsert({
    where: { id: 'ws_egypt_eunoia' },
    update: {},
    create: {
      id: 'ws_egypt_eunoia',
      name: 'Eunoia Egypt',
      plan: 'ENTERPRISE',
      ownerId: 'user_admin_egypt',
    },
  })

  // Create UAE workspace
  const uaeWorkspace = await prisma.workspace.upsert({
    where: { id: 'ws_uae_eunoia' },
    update: {},
    create: {
      id: 'ws_uae_eunoia',
      name: 'Eunoia UAE',
      plan: 'ENTERPRISE',
      ownerId: 'user_admin_uae',
    },
  })

  const adminPasswordHash = await bcrypt.hash('EunoiaAdmin2025!', 12)

  // Admin user — Egypt
  await prisma.user.upsert({
    where: { id: 'user_admin_egypt' },
    update: {},
    create: {
      id: 'user_admin_egypt',
      email: 'admin@eunoia.eg',
      name: 'Eunoia Admin (Egypt)',
      role: 'ADMIN',
      workspaceId: egyptWorkspace.id,
      passwordHash: adminPasswordHash,
    },
  })

  // Admin user — UAE
  await prisma.user.upsert({
    where: { id: 'user_admin_uae' },
    update: {},
    create: {
      id: 'user_admin_uae',
      email: 'admin@eunoia.ae',
      name: 'Eunoia Admin (UAE)',
      role: 'ADMIN',
      workspaceId: uaeWorkspace.id,
      passwordHash: adminPasswordHash,
    },
  })

  // Demo agency user
  await prisma.user.upsert({
    where: { email: 'demo@eunoia.eg' },
    update: {},
    create: {
      email: 'demo@eunoia.eg',
      name: 'Demo Agency User',
      role: 'AGENCY',
      workspaceId: egyptWorkspace.id,
      passwordHash: await bcrypt.hash('Demo2025!', 12),
    },
  })

  console.log('✅ Workspaces:', egyptWorkspace.name, uaeWorkspace.name)
  console.log('✅ Admin users created')
  console.log('✅ Demo user created: demo@eunoia.eg / Demo2025!')
  console.log('🎉 Seed complete')
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error('❌ Seed failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
