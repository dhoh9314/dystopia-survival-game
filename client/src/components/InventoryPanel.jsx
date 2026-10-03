import { ITEM_NAMES } from '../data/items.js'

function describeItem(item) {
  if (!item) return ''
  if (item.type === 'weapon') return `공격력 +${item.damageBonus}`
  if (item.type === 'armor') return `방어 ${Math.round(item.defensePercent * 100)}%`
  return item.description ?? ''
}

export default function InventoryPanel({ self, itemsById, onUse, onEquip, onUnequip, onClose }) {
  const weapon = self.equippedWeapon ? itemsById[self.equippedWeapon] : null
  const armor = self.equippedArmor ? itemsById[self.equippedArmor] : null

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="panel modal inventory-panel" onClick={(e) => e.stopPropagation()}>
        <div className="hud-inventory-title">장비</div>
        <div className="equip-slots">
          <div className="equip-slot">
            <span className="equip-slot-label">무기</span>
            {weapon ? (
              <>
                <span>{ITEM_NAMES[weapon.id] ?? weapon.id} (+{weapon.damageBonus})</span>
                <button className="btn" onClick={() => onUnequip('weapon')}>해제</button>
              </>
            ) : (
              <span className="subtitle">장착 안 함</span>
            )}
          </div>
          <div className="equip-slot">
            <span className="equip-slot-label">방어구</span>
            {armor ? (
              <>
                <span>{ITEM_NAMES[armor.id] ?? armor.id} ({Math.round(armor.defensePercent * 100)}%)</span>
                <button className="btn" onClick={() => onUnequip('armor')}>해제</button>
              </>
            ) : (
              <span className="subtitle">장착 안 함</span>
            )}
          </div>
        </div>

        <div className="hud-inventory-title" style={{ marginTop: 18 }}>인벤토리</div>
        {self.inventory.length === 0 && <div className="subtitle">비어 있음</div>}
        {self.inventory.map((slot) => {
          const item = itemsById[slot.itemId]
          const isEquipped =
            (item?.type === 'weapon' && self.equippedWeapon === slot.itemId) ||
            (item?.type === 'armor' && self.equippedArmor === slot.itemId)
          return (
            <div key={slot.itemId} className="hud-inventory-row">
              <div>
                <div>{ITEM_NAMES[slot.itemId] ?? slot.itemId} x{slot.qty}</div>
                <div className="item-sub-desc">{describeItem(item)}</div>
              </div>
              {item?.type === 'consumable' && (
                <button className="btn" onClick={() => onUse(slot.itemId)}>사용</button>
              )}
              {(item?.type === 'weapon' || item?.type === 'armor') && (
                <button className="btn" disabled={isEquipped} onClick={() => onEquip(slot.itemId)}>
                  {isEquipped ? '장착 중' : '장착'}
                </button>
              )}
            </div>
          )
        })}
        <button className="btn" style={{ marginTop: 12, width: '100%' }} onClick={onClose}>
          닫기
        </button>
      </div>
    </div>
  )
}
