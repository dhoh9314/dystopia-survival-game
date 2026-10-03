export default function LocationPanel({ location, presence, onSearch, onRest, onTravel, onTradeRequest, disabled }) {
  if (!location) return null

  return (
    <div className="panel location-panel">
      <div className="location-header">
        <div className="location-name">{location.name}</div>
        <span className="location-kind">{location.kind}</span>
        {location.isSafe && <span className="location-safe-badge">안전지대</span>}
        {location.shelter && (
          <span className={`location-shelter-badge ${location.shelter.hasAccess ? 'access' : ''}`}>
            쉘터: {location.shelter.name}
          </span>
        )}
      </div>
      <div className="location-zone-line">
        {location.zoneName} · 위험도 {'▲'.repeat(location.dangerLevel)}
      </div>
      <p className="location-description">{location.description}</p>

      <div className="location-presence">
        {presence.length === 0 ? (
          '이곳에는 당신뿐입니다.'
        ) : (
          presence.map((p) => (
            <div key={p.id} className="location-presence-row">
              <span>{p.name} (Lv.{p.level})</span>
              <button
                className="btn presence-trade-btn"
                onClick={() => onTradeRequest(p.id, p.name)}
                disabled={disabled}
              >
                거래 제안
              </button>
            </div>
          ))
        )}
      </div>

      <div className="location-actions">
        <button className="btn btn-primary" onClick={onSearch} disabled={disabled}>
          탐색하기
        </button>
        {(location.isSafe || location.shelter?.hasAccess) && (
          <button className="btn" onClick={onRest} disabled={disabled}>
            휴식하기
          </button>
        )}
      </div>

      <div className="location-connections">
        <div className="location-connections-title">이동 가능한 장소</div>
        <div className="location-connections-grid">
          {location.connections.map((c) => (
            <button
              key={c.id}
              className="btn location-connection-btn"
              onClick={() => onTravel(c.id)}
              disabled={disabled}
            >
              {c.name}
              {c.crossZone && <span className="location-connection-zone"> · {c.zoneName}</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
