import { useEffect, useState } from 'react'
import { ACTIVE_ABILITY_LABEL } from '../data/superpowers.js'
import { ITEM_NAMES } from '../data/items.js'

const CONSUMABLE_IDS = new Set(['medkit', 'ration_pack', 'water_canteen', 'stim_pack'])

export default function CombatPanel({ self, mobName, log, onAction, pending }) {
  const [itemMenuOpen, setItemMenuOpen] = useState(false)
  const [, forceTick] = useState(0)

  useEffect(() => {
    const iv = setInterval(() => forceTick((n) => n + 1), 1000)
    return () => clearInterval(iv)
  }, [])

  const encounter = self.encounter
  if (!encounter) return null

  const abilityLabel = ACTIVE_ABILITY_LABEL[self.superpower]
  const cooldownMs = (self.abilityReadyAt ?? 0) - Date.now()
  const abilityOnCooldown = cooldownMs > 0
  const hpRatio = Math.max(0, Math.min(1, encounter.mobHp / encounter.mobMaxHp))
  const consumables = self.inventory.filter((s) => CONSUMABLE_IDS.has(s.itemId))

  return (
    <div className="modal-backdrop">
      <div className="panel modal combat-panel">
        <div className="combat-mob-name">{mobName ?? encounter.mobType}</div>

        <div className="combat-mob-hp-row">
          <div className="hud-bar-track combat-mob-hp-track">
            <div className="hud-bar-fill" style={{ width: `${hpRatio * 100}%`, background: '#e2574c' }} />
          </div>
          <span className="combat-mob-hp-text">{encounter.mobHp}/{encounter.mobMaxHp}</span>
        </div>

        {(encounter.mobStunTurns > 0 || encounter.mobBurnTurns > 0) && (
          <div className="combat-status-tags">
            {encounter.mobStunTurns > 0 && <span className="combat-tag">마비 {encounter.mobStunTurns}턴</span>}
            {encounter.mobBurnTurns > 0 && <span className="combat-tag">화상 {encounter.mobBurnTurns}턴</span>}
          </div>
        )}

        <div className="combat-log">
          {log.length === 0 && <div className="combat-log-line subtitle">행동을 선택하세요.</div>}
          {log.map((line, i) => (
            <div key={i} className="combat-log-line">{line}</div>
          ))}
        </div>

        {itemMenuOpen ? (
          <div className="combat-item-menu">
            {consumables.length === 0 && <div className="subtitle">사용할 아이템이 없습니다.</div>}
            {consumables.map((s) => (
              <button
                key={s.itemId}
                className="btn"
                disabled={pending}
                onClick={() => {
                  onAction('item', s.itemId)
                  setItemMenuOpen(false)
                }}
              >
                {ITEM_NAMES[s.itemId]} x{s.qty}
              </button>
            ))}
            <button className="btn" onClick={() => setItemMenuOpen(false)}>닫기</button>
          </div>
        ) : (
          <div className="combat-actions">
            <button className="btn btn-primary" disabled={pending} onClick={() => onAction('attack')}>
              공격
            </button>
            {abilityLabel && (
              <button className="btn" disabled={pending || abilityOnCooldown} onClick={() => onAction('ability')}>
                {abilityLabel}
                {abilityOnCooldown ? ` (${Math.ceil(cooldownMs / 1000)}s)` : ''}
              </button>
            )}
            <button className="btn" disabled={pending} onClick={() => setItemMenuOpen(true)}>
              아이템
            </button>
            <button className="btn btn-danger" disabled={pending} onClick={() => onAction('flee')}>
              도망
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
