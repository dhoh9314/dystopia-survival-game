import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api.js'

const MAX_CHARACTERS = 3

export default function CharacterSelectPage() {
  const navigate = useNavigate()
  const [account, setAccount] = useState(null)
  const [characters, setCharacters] = useState([])
  const [superpowers, setSuperpowers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [{ account }, { characters }, { superpowers }] = await Promise.all([
          api.me(),
          api.listCharacters(),
          api.superpowers(),
        ])
        if (cancelled) return
        setAccount(account)
        setCharacters(characters)
        setSuperpowers(superpowers)
      } catch {
        navigate('/')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [navigate])

  async function refreshCharacters() {
    const { characters } = await api.listCharacters()
    setCharacters(characters)
  }

  async function handleDelete(id) {
    if (!confirm('이 캐릭터를 삭제하시겠습니까? 되돌릴 수 없습니다.')) return
    await api.deleteCharacter(id)
    await refreshCharacters()
  }

  async function handleSelect(id) {
    const { socketToken } = await api.selectCharacter(id)
    sessionStorage.setItem(`socketToken:${id}`, socketToken)
    navigate(`/play/${id}`)
  }

  if (loading) {
    return (
      <div className="screen">
        <div className="subtitle">접속하는 중...</div>
      </div>
    )
  }

  const slots = [...characters]
  while (slots.length < MAX_CHARACTERS) slots.push(null)

  return (
    <div className="screen" style={{ flexDirection: 'column', gap: 24 }}>
      <div style={{ textAlign: 'center' }}>
        <div className="title">생존자 선택</div>
        <div className="subtitle">{account?.displayName}님, 황무지로 보낼 캐릭터를 선택하세요.</div>
      </div>

      <div className="char-grid">
        {slots.map((char, i) =>
          char ? (
            <CharacterCard
              key={char.id}
              character={char}
              onSelect={() => handleSelect(char.id)}
              onDelete={() => handleDelete(char.id)}
            />
          ) : (
            <EmptySlot key={`empty-${i}`} onClick={() => setCreating(true)} />
          )
        )}
      </div>

      {error && <div className="error-text">{error}</div>}

      {creating && (
        <CreateCharacterModal
          superpowers={superpowers}
          onClose={() => setCreating(false)}
          onCreated={async () => {
            setCreating(false)
            await refreshCharacters()
          }}
          onError={setError}
        />
      )}
    </div>
  )
}

function CharacterCard({ character, onSelect, onDelete }) {
  return (
    <div className="char-slot">
      <div className="char-name">{character.name}</div>
      <div className="char-power">{character.superpower}</div>
      <div className="char-level">Lv.{character.level} · {character.zoneId}</div>
      <div style={{ flex: 1 }}>
        <div className="stat-row"><span>HP</span><span>{character.hp}/{character.maxHp}</span></div>
        <div className="stat-row"><span>근력</span><span>{character.strength}</span></div>
        <div className="stat-row"><span>민첩</span><span>{character.agility}</span></div>
        <div className="stat-row"><span>감지</span><span>{character.perception}</span></div>
        <div className="stat-row"><span>생명력</span><span>{character.vitality}</span></div>
      </div>
      <button className="btn btn-primary" onClick={onSelect}>입장</button>
      <button className="btn btn-danger" onClick={onDelete}>삭제</button>
    </div>
  )
}

function EmptySlot({ onClick }) {
  return (
    <button className="char-slot empty" onClick={onClick}>
      + 새 생존자
    </button>
  )
}

function CreateCharacterModal({ superpowers, onClose, onCreated, onError }) {
  const [name, setName] = useState('')
  const [selected, setSelected] = useState(superpowers[0]?.id ?? '')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.createCharacter(name, selected)
      onCreated()
    } catch (err) {
      onError(err.message)
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="panel modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <div className="title" style={{ fontSize: 20 }}>새 생존자</div>

        <div className="field" style={{ marginTop: 16 }}>
          <label htmlFor="charName">이름</label>
          <input
            id="charName"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={16}
            autoFocus
            required
          />
        </div>

        <label style={{ fontSize: 12, color: 'var(--text-dim)', textTransform: 'uppercase' }}>초능력 선택</label>
        <div className="power-grid">
          {superpowers.map((p) => (
            <div
              key={p.id}
              className={`power-card ${selected === p.id ? 'selected' : ''}`}
              onClick={() => setSelected(p.id)}
            >
              <div className="power-card-name">{p.name}</div>
              <div className="power-card-desc">{p.description}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
          <button type="button" className="btn" onClick={onClose} style={{ flex: 1 }}>
            취소
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting} style={{ flex: 1 }}>
            생성
          </button>
        </div>
      </form>
    </div>
  )
}
