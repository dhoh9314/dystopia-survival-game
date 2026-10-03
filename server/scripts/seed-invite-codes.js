import 'dotenv/config'
import { customAlphabet } from 'nanoid'
import { prisma } from '../src/db.js'

const nanoid = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 8)
const count = Number(process.argv[2] ?? 10)

const codes = []
for (let i = 0; i < count; i++) {
  codes.push(nanoid())
}

await prisma.inviteCode.createMany({
  data: codes.map((code) => ({ code })),
})

console.log(`Created ${codes.length} invite codes:\n`)
for (const code of codes) console.log(code)

await prisma.$disconnect()
