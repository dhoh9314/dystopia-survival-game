function nodeIcon(loc) {
  if (loc.isSafe) return '⌂'
  return '◆'
}

export default function ZoneMap({ zoneMap, currentLocationId, reachableIds, onTravel }) {
  if (!zoneMap) return null

  const byId = Object.fromEntries(zoneMap.locations.map((l) => [l.id, l]))
  const edges = []
  const seen = new Set()
  for (const loc of zoneMap.locations) {
    for (const c of loc.connections) {
      if (!byId[c]) continue
      const key = [loc.id, c].sort().join('|')
      if (seen.has(key)) continue
      seen.add(key)
      edges.push([loc, byId[c]])
    }
  }

  return (
    <div className="zone-map panel">
      <div className="zone-map-header">
        <div className="zone-map-title">
          {zoneMap.zoneName}
          <span className="zone-map-danger">위험도 {'▲'.repeat(zoneMap.dangerLevel)}</span>
        </div>
        <div className="zone-map-desc">{zoneMap.zoneDescription}</div>
      </div>

      <svg viewBox="-4 -4 108 108" className="zone-map-svg" preserveAspectRatio="xMidYMid meet">
        {edges.map(([a, b], i) => (
          <line
            key={i}
            x1={a.position.x}
            y1={a.position.y}
            x2={b.position.x}
            y2={b.position.y}
            className="zone-map-edge"
          />
        ))}
        {zoneMap.locations.map((loc) => {
          const isCurrent = loc.id === currentLocationId
          const isReachable = reachableIds.has(loc.id)
          const classes = ['zone-map-node']
          if (isCurrent) classes.push('current')
          if (loc.isSafe) classes.push('safe')
          else classes.push('danger')
          if (isReachable) classes.push('reachable')
          return (
            <g
              key={loc.id}
              transform={`translate(${loc.position.x}, ${loc.position.y})`}
              className={classes.join(' ')}
              onClick={() => isReachable && onTravel(loc.id)}
            >
              {isCurrent && <circle className="zone-map-node-pulse" r="5.5" />}
              <circle className="zone-map-node-circle" r={isCurrent ? 4 : 3.1} />
              <text className="zone-map-node-icon" dy="1.1" textAnchor="middle">{nodeIcon(loc)}</text>
              <rect className="zone-map-node-label-bg" x="-13" y="-9.2" width="26" height="4.6" rx="1" />
              <text className="zone-map-node-label" y="-5.8" textAnchor="middle">{loc.name}</text>
            </g>
          )
        })}
      </svg>

      <div className="zone-map-legend">
        <span><i className="zone-map-legend-dot safe" /> 안전지대</span>
        <span><i className="zone-map-legend-dot danger" /> 위험 구역</span>
        <span><i className="zone-map-legend-dot current" /> 현재 위치</span>
        <span className="zone-map-legend-dim">흐린 노드는 바로 이동 불가</span>
      </div>

      {zoneMap.gateways.length > 0 && (
        <div className="zone-map-gateways">
          <div className="zone-map-gateways-title">경계 통로</div>
          {zoneMap.gateways.map((g) => (
            <button
              key={g.id}
              className="btn zone-gateway-btn"
              disabled={!reachableIds.has(g.id)}
              onClick={() => onTravel(g.id)}
            >
              → {g.zoneName} · {g.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
