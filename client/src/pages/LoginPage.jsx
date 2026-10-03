import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api.js'

export default function LoginPage() {
  const navigate = useNavigate()
  const [inviteCode, setInviteCode] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [needsDisplayName, setNeedsDisplayName] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.redeem(inviteCode, displayName)
      navigate('/characters')
    } catch (err) {
      if (err.data?.needsDisplayName) {
        setNeedsDisplayName(true)
        setError('새 계정입니다. 닉네임을 입력하세요.')
      } else {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="screen">
      <form className="panel" style={{ width: 400, padding: 32 }} onSubmit={handleSubmit}>
        <div className="title">황폐 신호</div>
        <p className="subtitle" style={{ marginTop: 6, marginBottom: 24 }}>
          정전 이후의 도시. 살아남은 자들만이 신호를 주고받는다.
          <br />
          초대코드로 접속하세요.
        </p>

        <div className="field">
          <label htmlFor="inviteCode">초대코드</label>
          <input
            id="inviteCode"
            className="input"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            placeholder="예: AB12CD34"
            autoFocus
            maxLength={16}
          />
        </div>

        {needsDisplayName && (
          <div className="field">
            <label htmlFor="displayName">닉네임</label>
            <input
              id="displayName"
              className="input"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="생존자 이름"
              maxLength={20}
            />
          </div>
        )}

        {error && <div className="error-text">{error}</div>}

        <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', marginTop: 8 }}>
          {loading ? '접속 중...' : '접속'}
        </button>
      </form>
    </div>
  )
}
