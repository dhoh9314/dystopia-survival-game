import { Router } from 'express'
import { prisma } from '../db.js'
import { issueSession, clearSession, requireAuth } from '../auth.js'

export const authRouter = Router()

// Redeem an invite code. First use creates the account; reusing the same
// code afterward just logs back into that account (invite code == login key).
authRouter.post('/redeem', async (req, res) => {
  const { inviteCode, displayName } = req.body ?? {}
  if (typeof inviteCode !== 'string' || !inviteCode.trim()) {
    return res.status(400).json({ error: '초대코드를 입력하세요.' })
  }

  const code = inviteCode.trim().toUpperCase()
  const invite = await prisma.inviteCode.findUnique({
    where: { code },
    include: { account: true },
  })

  if (!invite) {
    return res.status(404).json({ error: '유효하지 않은 초대코드입니다.' })
  }

  if (invite.account) {
    const account = await prisma.account.update({
      where: { id: invite.account.id },
      data: { lastLoginAt: new Date() },
    })
    issueSession(res, account)
    return res.json({ account: { id: account.id, displayName: account.displayName } })
  }

  if (typeof displayName !== 'string' || !displayName.trim()) {
    return res.status(400).json({ error: '새 계정을 만들려면 닉네임이 필요합니다.', needsDisplayName: true })
  }

  const account = await prisma.account.create({
    data: {
      displayName: displayName.trim().slice(0, 20),
      inviteCodeId: invite.id,
    },
  })
  await prisma.inviteCode.update({ where: { id: invite.id }, data: { usedAt: new Date() } })

  issueSession(res, account)
  return res.json({ account: { id: account.id, displayName: account.displayName } })
})

authRouter.post('/logout', requireAuth, (req, res) => {
  clearSession(res)
  res.json({ ok: true })
})

authRouter.get('/me', requireAuth, async (req, res) => {
  const account = await prisma.account.findUnique({ where: { id: req.accountId } })
  if (!account) return res.status(404).json({ error: 'not found' })
  res.json({ account: { id: account.id, displayName: account.displayName } })
})
