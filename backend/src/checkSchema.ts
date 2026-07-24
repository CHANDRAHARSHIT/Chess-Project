import { prisma } from './config/prisma.js'

async function main() {
  const result = await prisma.$queryRaw`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'Opening'`
  console.log(JSON.stringify(result, null, 2))
}

main().catch(console.error).finally(() => prisma.$disconnect())
