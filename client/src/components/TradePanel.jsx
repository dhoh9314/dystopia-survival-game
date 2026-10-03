import { useEffect, useState } from 'react'
import { ITEM_NAMES } from '../data/items.js'

export default function TradePanel({ trade, self, onUpdateOffer, onConfirm, onCancel }) {
  const [offerQtys, setOfferQtys] = useState({})

  useEffect(() => {
    const map = {}
    for (const o of trade.myOffer) map[o.itemId] = o.qty
    setOfferQtys(map)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trade.tradeId])

  function setQty(itemId, qty, maxQty) {
    const clamped = Math.max(0, Math.min(maxQty, qty))
    const next = { ...offerQtys }
    if (clamped === 0) delete next[itemId]
    else next[itemId] = clamped
    setOfferQtys(next)
    onUpdateOffer(Object.entries(next).map(([id, q]) => ({ itemId: id, qty: q })))
  }

  return (
    <div className="modal-backdrop">
      <div className="panel modal trade-panel">
        <div className="trade-header">{self.name} ↔ {trade.other.name}</div>

        <div className="trade-columns">
          <div className="trade-column">
            <div className="trade-column-title">
              내 제안 {trade.myConfirmed && <span className="trade-confirmed-tag">확정됨</span>}
            </div>
            {self.inventory.length === 0 && <div className="subtitle">제안할 아이템이 없습니다.</div>}
            {self.inventory.map((slot) => (
              <div key={slot.itemId} className="trade-item-row">
                <span>{ITEM_NAMES[slot.itemId] ?? slot.itemId} <span className="trade-owned">(보유 {slot.qty})</span></span>
                <div className="trade-stepper">
                  <button
                    className="btn"
                    disabled={trade.myConfirmed}
                    onClick={() => setQty(slot.itemId, (offerQtys[slot.itemId] ?? 0) - 1, slot.qty)}
                  >
                    −
                  </button>
                  <span className="trade-stepper-qty">{offerQtys[slot.itemId] ?? 0}</span>
                  <button
                    className="btn"
                    disabled={trade.myConfirmed}
                    onClick={() => setQty(slot.itemId, (offerQtys[slot.itemId] ?? 0) + 1, slot.qty)}
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="trade-column">
            <div className="trade-column-title">
              {trade.other.name}의 제안 {trade.otherConfirmed && <span className="trade-confirmed-tag">확정됨</span>}
            </div>
            {trade.otherOffer.length === 0 && <div className="subtitle">아직 제안한 아이템이 없습니다.</div>}
            {trade.otherOffer.map((o) => (
              <div key={o.itemId} className="trade-item-row">
                <span>{ITEM_NAMES[o.itemId] ?? o.itemId} x{o.qty}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="trade-actions">
          <button className="btn btn-primary" disabled={trade.myConfirmed} onClick={onConfirm}>
            {trade.myConfirmed ? '상대 확정 대기 중...' : '확정'}
          </button>
          <button className="btn btn-danger" onClick={onCancel}>
            거래 취소
          </button>
        </div>
      </div>
    </div>
  )
}
