import { useState } from 'react'

export default function CodexPanel({ self, codexInfo, onClose }) {
  const [tab, setTab] = useState('lore')

  const discoveredMobIds = new Set(self.discoveredMobs)
  const mobs = codexInfo?.mobs ?? []
  const totalLore = codexInfo?.totalLoreEntries ?? 0

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="panel modal codex-panel" onClick={(e) => e.stopPropagation()}>
        <div className="codex-tabs">
          <button className={`codex-tab ${tab === 'lore' ? 'active' : ''}`} onClick={() => setTab('lore')}>
            기록보관소 ({self.discoveredLore.length}/{totalLore})
          </button>
          <button className={`codex-tab ${tab === 'bestiary' ? 'active' : ''}`} onClick={() => setTab('bestiary')}>
            로봇 도감 ({discoveredMobIds.size}/{mobs.length})
          </button>
        </div>

        {tab === 'lore' && (
          <div className="codex-list">
            {self.discoveredLore.length === 0 && <div className="subtitle">아직 발견한 기록이 없습니다.</div>}
            {self.discoveredLore.map((text, i) => (
              <div key={i} className="codex-lore-entry">{text}</div>
            ))}
          </div>
        )}

        {tab === 'bestiary' && (
          <div className="codex-list">
            {mobs.map((m) => {
              const discovered = discoveredMobIds.has(m.id)
              return (
                <div key={m.id} className="codex-mob-entry">
                  <div className="codex-mob-name">{discovered ? m.name : '???'}</div>
                  {discovered ? (
                    <>
                      <div className="codex-mob-desc">{m.codexEntry}</div>
                      <div className="codex-mob-stats">
                        체력 {m.maxHp} · 공격력 {m.damage} · 처치 경험치 {m.xpReward}
                      </div>
                    </>
                  ) : (
                    <div className="codex-mob-desc subtitle">아직 처치하지 않았습니다.</div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <button className="btn" style={{ marginTop: 14, width: '100%' }} onClick={onClose}>
          닫기
        </button>
      </div>
    </div>
  )
}
