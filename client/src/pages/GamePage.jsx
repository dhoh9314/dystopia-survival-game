import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { io } from 'socket.io-client'
import { api, API_BASE } from '../lib/api.js'
import { ITEM_NAMES } from '../data/items.js'
import { SUPERPOWER_NAMES } from '../data/superpowers.js'
import { MOB_NAMES } from '../data/mobs.js'
import ZoneMap from '../components/ZoneMap.jsx'
import LocationPanel from '../components/LocationPanel.jsx'
import CombatPanel from '../components/CombatPanel.jsx'
import CraftingPanel from '../components/CraftingPanel.jsx'
import TradePanel from '../components/TradePanel.jsx'
import InventoryPanel from '../components/InventoryPanel.jsx'
import EventChoicePanel from '../components/EventChoicePanel.jsx'
import CodexPanel from '../components/CodexPanel.jsx'
import ShelterPanel from '../components/ShelterPanel.jsx'
import './GamePage.css'

export default function GamePage() {
  const { characterId } = useParams()
  const navigate = useNavigate()
  const socketRef = useRef(null)
  const selfRef = useRef(null)

  const [self, setSelf] = useState(null)
  const [location, setLocation] = useState(null)
  const [zoneMap, setZoneMap] = useState(null)
  const [presence, setPresence] = useState([])
  const [combatLog, setCombatLog] = useState([])
  const [combatMobName, setCombatMobName] = useState(null)
  const [eventLog, setEventLog] = useState([])
  const [inventoryOpen, setInventoryOpen] = useState(false)
  const [craftingOpen, setCraftingOpen] = useState(false)
  const [recipes, setRecipes] = useState([])
  const [itemsById, setItemsById] = useState({})
  const [codexInfo, setCodexInfo] = useState(null)
  const [codexOpen, setCodexOpen] = useState(false)
  const [fullLogOpen, setFullLogOpen] = useState(false)
  const [shelterOpen, setShelterOpen] = useState(false)
  const [actionPending, setActionPending] = useState(false)
  const [connError, setConnError] = useState('')

  const [tradeIncoming, setTradeIncoming] = useState(null) // { fromCharacterId, fromName }
  const [tradeOutgoing, setTradeOutgoing] = useState(null) // { toName }
  const [tradeState, setTradeState] = useState(null) // active trade session

  useEffect(() => {
    selfRef.current = self
  }, [self])

  useEffect(() => {
    api.recipes().then((d) => setRecipes(d.recipes)).catch(() => {})
    api.items().then((d) => setItemsById(Object.fromEntries(d.items.map((i) => [i.id, i])))).catch(() => {})
    api.codexInfo().then(setCodexInfo).catch(() => {})
  }, [])

  const pushEvent = useCallback((msg) => {
    const time = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    setEventLog((prev) => [{ id: Math.random(), msg, time }, ...prev].slice(0, 300))
  }, [])

  useEffect(() => {
    let disposed = false

    async function connect() {
      let token = sessionStorage.getItem(`socketToken:${characterId}`)
      if (!token) {
        try {
          const res = await api.selectCharacter(characterId)
          token = res.socketToken
          sessionStorage.setItem(`socketToken:${characterId}`, token)
        } catch {
          navigate('/characters')
          return
        }
      }

      if (disposed) return // effect was already cleaned up (e.g. React StrictMode double-invoke) — don't leak a connection

      const socket = io(API_BASE || undefined, { auth: { token, characterId } })
      socketRef.current = socket

      socket.on('connect_error', (err) => {
        if (disposed) return
        setConnError(err.message === 'unauthorized' ? '세션이 만료되었습니다. 다시 선택해주세요.' : '연결 실패')
      })

      socket.once('init', (d) => {
        if (disposed) return
        setSelf(d.self)
        setLocation(d.location)
        setZoneMap(d.zoneMap)
        setPresence(d.presence)
      })

      socket.on('self', (d) => !disposed && setSelf(d))

      socket.on('presenceUpdate', (list) => {
        if (disposed) return
        const selfId = selfRef.current?.id
        setPresence(list.filter((p) => p.id !== selfId))
      })

      socket.on('travelResult', (d) => {
        if (disposed) return
        setActionPending(false)
        if (d.error) return pushEvent(d.error)
        setSelf(d.self)
        setLocation(d.location)
        setPresence(d.presence)
        if (d.zoneMap) setZoneMap(d.zoneMap)
        pushEvent(`${d.location.name}(으)로 이동했습니다.`)
      })

      socket.on('searchResult', (d) => {
        if (disposed) return
        setActionPending(false)
        if (d.error) return pushEvent(d.error)
        setSelf(d.self)
        if (d.type === 'encounter') {
          setCombatMobName(d.mobName)
          setCombatLog([`${d.mobName}과(와) 조우했습니다!`])
        } else if (d.type === 'loot') {
          pushEvent(`획득: ${d.loot.map((i) => `${ITEM_NAMES[i.itemId] ?? i.itemId} x${i.qty}`).join(', ')}`)
        } else if (d.type === 'event' && d.eventType === 'choice') {
          // self.pendingEvent (already applied above) carries the prompt/choices;
          // the modal renders from that, so nothing to log here yet.
        } else if (d.type === 'event') {
          pushEvent(d.message)
          if (d.loot?.length) {
            pushEvent(`획득: ${d.loot.map((i) => `${ITEM_NAMES[i.itemId] ?? i.itemId} x${i.qty}`).join(', ')}`)
          }
          if (d.newlyDiscoveredLore) pushEvent('기록보관소에 새 기록이 추가되었습니다.')
        } else {
          pushEvent(d.message ?? '아무것도 찾지 못했습니다.')
        }
      })

      socket.on('eventChoiceResult', (d) => {
        if (disposed) return
        setActionPending(false)
        setSelf(d.self)
        if (d.error) return pushEvent(d.error)
        pushEvent(d.message)
        if (d.loot?.length) {
          pushEvent(`획득: ${d.loot.map((i) => `${ITEM_NAMES[i.itemId] ?? i.itemId} x${i.qty}`).join(', ')}`)
        }
      })

      socket.on('combatResult', (d) => {
        if (disposed) return
        setActionPending(false)
        if (d.error) {
          setCombatLog((prev) => [...prev, d.error])
          return
        }
        setSelf(d.self)
        if (d.log?.length) setCombatLog((prev) => [...prev, ...d.log])
        if (d.kill) {
          pushEvent(`+${d.kill.xpGained} XP${d.kill.levelsGained > 0 ? ` · 레벨 ${d.kill.newLevel} 달성!` : ''}`)
          if (d.kill.loot?.length) {
            pushEvent(`획득: ${d.kill.loot.map((i) => `${ITEM_NAMES[i.itemId] ?? i.itemId} x${i.qty}`).join(', ')}`)
          }
          if (d.kill.newlyDiscoveredMob) {
            pushEvent(`도감에 ${MOB_NAMES[d.kill.mobType] ?? d.kill.mobType}이(가) 등록되었습니다.`)
          }
        }
        if (d.fled) {
          setTimeout(() => setCombatLog([]), 600)
          pushEvent('전투에서 벗어났습니다.')
        }
      })

      socket.on('restResult', (d) => {
        if (disposed) return
        setActionPending(false)
        setSelf(d.self)
        pushEvent(d.error ?? '잠시 휴식을 취했습니다.')
      })

      socket.on('useItemResult', (d) => {
        if (disposed) return
        setSelf(d.self)
        if (d.error) pushEvent(d.error)
      })

      socket.on('craftResult', (d) => {
        if (disposed) return
        setSelf(d.self)
        if (d.error) pushEvent(d.error)
        else pushEvent(`${ITEM_NAMES[d.outputItemId] ?? d.outputItemId}을(를) 조합했습니다.`)
      })

      socket.on('equipResult', (d) => {
        if (disposed) return
        setSelf(d.self)
        if (d.error) pushEvent(d.error)
        else if (d.slot) pushEvent(d.itemId ? `${ITEM_NAMES[d.itemId] ?? d.itemId}을(를) 장착했습니다.` : '장비를 해제했습니다.')
      })

      socket.on('shelterResult', (d) => {
        if (disposed) return
        setSelf(d.self)
        if (d.location) setLocation(d.location)
        if (d.error) {
          pushEvent(d.error)
        } else if (d.shelter) {
          pushEvent('쉘터 정보가 갱신되었습니다.')
        } else {
          pushEvent('쉘터를 철거했습니다.')
        }
      })

      socket.on('respawned', (d) => {
        if (disposed) return
        setSelf(d.self)
        setLocation(d.location)
        setZoneMap(d.zoneMap)
        setPresence(d.presence)
        setCombatLog([])
        pushEvent('재투입되었습니다.')
      })

      // --- trading ---
      socket.on('tradeRequestSent', (d) => {
        if (disposed) return
        setTradeOutgoing({ toName: d.toName })
      })

      socket.on('tradeRequestReceived', (d) => {
        if (disposed) return
        setTradeIncoming({ fromCharacterId: d.fromCharacterId, fromName: d.fromName })
      })

      socket.on('tradeDeclined', (d) => {
        if (disposed) return
        setTradeOutgoing(null)
        pushEvent(`${d.byName}님이 거래를 거절했습니다.`)
      })

      socket.on('tradeStarted', (d) => {
        if (disposed) return
        setTradeOutgoing(null)
        setTradeIncoming(null)
        setTradeState({ tradeId: d.tradeId, other: d.other, myOffer: [], otherOffer: [], myConfirmed: false, otherConfirmed: false })
      })

      socket.on('tradeUpdate', (d) => {
        if (disposed) return
        setTradeState((prev) => (prev ? { ...prev, ...d } : null))
      })

      socket.on('tradeCompleted', (d) => {
        if (disposed) return
        setSelf(d.self)
        setTradeState(null)
        pushEvent('거래가 완료되었습니다.')
      })

      socket.on('tradeCancelled', (d) => {
        if (disposed) return
        setTradeState(null)
        pushEvent(d.reason ?? '거래가 취소되었습니다.')
      })

      socket.on('tradeError', (d) => {
        if (disposed) return
        pushEvent(d.error)
      })
    }

    connect()

    return () => {
      disposed = true
      socketRef.current?.disconnect()
      socketRef.current = null
      sessionStorage.removeItem(`socketToken:${characterId}`)
    }
  }, [characterId, navigate, pushEvent])

  const reachableIds = useMemo(
    () => new Set(location?.connections.map((c) => c.id) ?? []),
    [location]
  )

  function handleTravel(toLocationId) {
    if (actionPending) return
    setActionPending(true)
    socketRef.current?.emit('travel', { toLocationId })
  }

  function handleSearch() {
    if (actionPending) return
    setActionPending(true)
    socketRef.current?.emit('search')
  }

  function handleRest() {
    if (actionPending) return
    setActionPending(true)
    socketRef.current?.emit('rest')
  }

  function handleCombatAction(action, itemId) {
    if (actionPending) return
    setActionPending(true)
    socketRef.current?.emit('combatAction', { action, itemId })
  }

  function handleUseItem(itemId) {
    socketRef.current?.emit('useItem', { itemId })
  }

  function handleCraft(recipeId) {
    socketRef.current?.emit('craft', { recipeId })
  }

  function handleEventChoice(choiceId) {
    if (actionPending) return
    setActionPending(true)
    socketRef.current?.emit('eventChoice', { choiceId })
  }

  function handleEquip(itemId) {
    socketRef.current?.emit('equip', { itemId })
  }

  function handleUnequip(slot) {
    socketRef.current?.emit('unequip', { slot })
  }

  function handleBuildShelter(name) {
    socketRef.current?.emit('buildShelter', { name })
  }

  function handleDemolishShelter() {
    socketRef.current?.emit('demolishShelter')
  }

  function handleRegisterShelterPlayer(characterId) {
    socketRef.current?.emit('registerShelterPlayer', { characterId })
  }

  function handleUnregisterShelterPlayer(characterId) {
    socketRef.current?.emit('unregisterShelterPlayer', { characterId })
  }

  function handleRespawn() {
    socketRef.current?.emit('respawn')
  }

  function handleLeave() {
    navigate('/characters')
  }

  function handleTradeRequest(toCharacterId, toName) {
    setTradeOutgoing({ toName })
    socketRef.current?.emit('tradeRequest', { toCharacterId })
  }

  function handleTradeAccept() {
    if (!tradeIncoming) return
    socketRef.current?.emit('tradeRespond', { fromCharacterId: tradeIncoming.fromCharacterId, accept: true })
  }

  function handleTradeDecline() {
    if (!tradeIncoming) return
    socketRef.current?.emit('tradeRespond', { fromCharacterId: tradeIncoming.fromCharacterId, accept: false })
    setTradeIncoming(null)
  }

  function handleTradeOfferUpdate(items) {
    if (!tradeState) return
    socketRef.current?.emit('tradeOffer', { tradeId: tradeState.tradeId, items })
  }

  function handleTradeConfirm() {
    if (!tradeState) return
    socketRef.current?.emit('tradeConfirm', { tradeId: tradeState.tradeId })
  }

  function handleTradeCancel() {
    if (!tradeState) return
    socketRef.current?.emit('tradeCancel', { tradeId: tradeState.tradeId })
  }

  if (connError) {
    return (
      <div className="screen">
        <div className="panel" style={{ padding: 32, textAlign: 'center' }}>
          <div className="error-text" style={{ marginBottom: 16 }}>{connError}</div>
          <button className="btn btn-primary" onClick={() => navigate('/characters')}>캐릭터 선택으로</button>
        </div>
      </div>
    )
  }

  if (!self || !location) {
    return (
      <div className="screen">
        <div className="subtitle">접속하는 중...</div>
      </div>
    )
  }

  const busy = actionPending || !!self.encounter || self.isDead || !!tradeState || !!self.pendingEvent

  return (
    <div className="game-page">
      <div className="game-topbar">
        <div className="game-char-line">
          {self.name} · Lv.{self.level} · {SUPERPOWER_NAMES[self.superpower] ?? self.superpower}
        </div>
        <div className="game-topbar-actions">
          <button className="btn" onClick={() => setCraftingOpen((v) => !v)}>조합</button>
          <button className="btn" onClick={() => setInventoryOpen((v) => !v)}>인벤토리</button>
          <button className="btn" onClick={() => setCodexOpen((v) => !v)}>기록보관소</button>
          <button className="btn" onClick={() => setShelterOpen((v) => !v)}>쉘터</button>
          <button className="btn" onClick={handleLeave}>나가기</button>
        </div>
      </div>

      <div className="game-layout">
        <div className="game-sidebar">
          <div className="panel stat-panel">
            <Bar label="HP" value={self.hp} max={self.maxHp} color="#e2574c" />
            <Bar label="허기" value={self.hunger} max={100} color="#d9a441" />
            <Bar label="갈증" value={self.thirst} max={100} color="#5a9fd4" />
            <Bar label="피로" value={self.fatigue} max={100} color="#8b7fd9" />
            <XpBar self={self} />
            <div className="equip-summary">
              <span>무기: {self.equippedWeapon ? ITEM_NAMES[self.equippedWeapon] : '없음'}</span>
              <span>방어구: {self.equippedArmor ? ITEM_NAMES[self.equippedArmor] : '없음'}</span>
            </div>
          </div>
          <ZoneMap zoneMap={zoneMap} currentLocationId={location.id} reachableIds={reachableIds} onTravel={handleTravel} />
        </div>

        <div className="game-main">
          <LocationPanel
            location={location}
            presence={presence}
            onSearch={handleSearch}
            onRest={handleRest}
            onTravel={handleTravel}
            onTradeRequest={handleTradeRequest}
            disabled={busy}
          />

          <div className="event-log panel">
            <div className="event-log-header">
              <div className="event-log-title">활동 기록 {eventLog.length > 0 && `(${eventLog.length})`}</div>
              {eventLog.length > 0 && (
                <button className="btn event-log-expand-btn" onClick={() => setFullLogOpen(true)}>
                  전체 기록 보기
                </button>
              )}
            </div>
            <div className="event-log-scroll">
              {eventLog.length === 0 && <div className="subtitle">아직 아무 일도 일어나지 않았습니다.</div>}
              {eventLog.map((l) => (
                <div key={l.id} className="event-log-line">
                  <span className="event-log-time">{l.time}</span>
                  <span>{l.msg}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {self.encounter && (
        <CombatPanel
          self={self}
          mobName={combatMobName ?? MOB_NAMES[self.encounter.mobType]}
          log={combatLog}
          onAction={handleCombatAction}
          pending={actionPending}
        />
      )}

      {self.pendingEvent && !self.encounter && (
        <EventChoicePanel event={self.pendingEvent} onChoose={handleEventChoice} pending={actionPending} />
      )}

      {craftingOpen && !self.encounter && (
        <CraftingPanel recipes={recipes} self={self} onCraft={handleCraft} onClose={() => setCraftingOpen(false)} />
      )}

      {inventoryOpen && !self.encounter && (
        <InventoryPanel
          self={self}
          itemsById={itemsById}
          onUse={handleUseItem}
          onEquip={handleEquip}
          onUnequip={handleUnequip}
          onClose={() => setInventoryOpen(false)}
        />
      )}

      {codexOpen && (
        <CodexPanel self={self} codexInfo={codexInfo} onClose={() => setCodexOpen(false)} />
      )}

      {fullLogOpen && (
        <div className="modal-backdrop" onClick={() => setFullLogOpen(false)}>
          <div className="panel modal full-log-panel" onClick={(e) => e.stopPropagation()}>
            <div className="event-log-title">전체 활동 기록 ({eventLog.length})</div>
            <div className="full-log-scroll">
              {eventLog.map((l) => (
                <div key={l.id} className="event-log-line">
                  <span className="event-log-time">{l.time}</span>
                  <span>{l.msg}</span>
                </div>
              ))}
            </div>
            <button className="btn" style={{ marginTop: 14, width: '100%' }} onClick={() => setFullLogOpen(false)}>
              닫기
            </button>
          </div>
        </div>
      )}

      {shelterOpen && (
        <ShelterPanel
          self={self}
          location={location}
          onBuild={(name) => { handleBuildShelter(name); setShelterOpen(false) }}
          onDemolish={() => { handleDemolishShelter(); setShelterOpen(false) }}
          onRegister={handleRegisterShelterPlayer}
          onUnregister={handleUnregisterShelterPlayer}
          onClose={() => setShelterOpen(false)}
        />
      )}

      {tradeOutgoing && !tradeState && (
        <div className="modal-backdrop">
          <div className="panel modal" style={{ textAlign: 'center' }}>
            <p className="subtitle">{tradeOutgoing.toName}님에게 거래를 제안했습니다. 응답을 기다리는 중...</p>
            <button className="btn" style={{ marginTop: 12 }} onClick={() => setTradeOutgoing(null)}>닫기</button>
          </div>
        </div>
      )}

      {tradeIncoming && !tradeState && (
        <div className="modal-backdrop">
          <div className="panel modal" style={{ textAlign: 'center' }}>
            <p className="subtitle">{tradeIncoming.fromName}님이 거래를 제안했습니다.</p>
            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <button className="btn" style={{ flex: 1 }} onClick={handleTradeDecline}>거절</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleTradeAccept}>수락</button>
            </div>
          </div>
        </div>
      )}

      {tradeState && (
        <TradePanel
          trade={tradeState}
          self={self}
          onUpdateOffer={handleTradeOfferUpdate}
          onConfirm={handleTradeConfirm}
          onCancel={handleTradeCancel}
        />
      )}

      {self.isDead && (
        <div className="modal-backdrop">
          <div className="panel modal" style={{ textAlign: 'center' }}>
            <div className="title" style={{ fontSize: 22, color: 'var(--danger)' }}>사망</div>
            <p className="subtitle">황무지가 당신을 집어삼켰습니다.</p>
            <button className="btn btn-primary" onClick={handleRespawn}>재투입</button>
          </div>
        </div>
      )}
    </div>
  )
}

function Bar({ label, value, max, color }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div className="hud-bar">
      <div className="hud-bar-label">
        <span>{label}</span>
        <span>{Math.round(value)}/{Math.round(max)}</span>
      </div>
      <div className="hud-bar-track">
        <div className="hud-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

function XpBar({ self }) {
  const xpNeeded = Math.round(40 * Math.pow(self.level, 1.5) + 20)
  return <Bar label={`XP (Lv.${self.level})`} value={self.xp} max={xpNeeded} color="#7c6ff0" />
}
