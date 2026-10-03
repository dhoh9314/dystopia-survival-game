import { useMemo, useState } from 'react'
import { ITEM_NAMES } from '../data/items.js'

function countOf(inventory, itemId) {
  return inventory.find((s) => s.itemId === itemId)?.qty ?? 0
}

export default function CraftingPanel({ recipes, self, onCraft, onClose }) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return recipes
    return recipes.filter((r) => {
      if (r.name.toLowerCase().includes(q)) return true
      if (r.description.toLowerCase().includes(q)) return true
      return r.inputs.some((i) => (ITEM_NAMES[i.itemId] ?? i.itemId).toLowerCase().includes(q))
    })
  }, [recipes, query])

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="panel modal crafting-panel" onClick={(e) => e.stopPropagation()}>
        <div className="hud-inventory-title">아이템 조합</div>

        <input
          className="input"
          style={{ marginBottom: 14 }}
          placeholder="이름, 재료로 검색..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        {filtered.length === 0 && <div className="subtitle">검색 결과가 없습니다.</div>}

        {filtered.map((r) => {
          const canCraft = r.inputs.every((i) => countOf(self.inventory, i.itemId) >= i.qty)
          return (
            <div key={r.id} className="recipe-row">
              <div className="recipe-info">
                <div className="recipe-name">{r.name}</div>
                <div className="recipe-desc">{r.description}</div>
                <div className="recipe-inputs">
                  {r.inputs.map((i) => {
                    const have = countOf(self.inventory, i.itemId)
                    return (
                      <span key={i.itemId} className={have >= i.qty ? 'recipe-input-ok' : 'recipe-input-lack'}>
                        {ITEM_NAMES[i.itemId] ?? i.itemId} {have}/{i.qty}
                      </span>
                    )
                  })}
                </div>
              </div>
              <button className="btn btn-primary" disabled={!canCraft} onClick={() => onCraft(r.id)}>
                조합
              </button>
            </div>
          )
        })}

        <button className="btn" style={{ marginTop: 14, width: '100%' }} onClick={onClose}>
          닫기
        </button>
      </div>
    </div>
  )
}
