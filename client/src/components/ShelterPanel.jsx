import { useState } from 'react'

const COST_LABEL = '고철 조각 5, 합금 플레이트 2, 회로 기판 2'

export default function ShelterPanel({ self, location, onBuild, onDemolish, onRegister, onUnregister, onClose }) {
  const [name, setName] = useState('')
  const shelter = self.myShelter

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="panel modal shelter-panel" onClick={(e) => e.stopPropagation()}>
        <div className="hud-inventory-title">쉘터</div>

        {shelter ? (
          <>
            <div className="shelter-info">
              <div className="shelter-name">{shelter.name}</div>
              <div className="subtitle">사망 시 이곳에서 재투입됩니다.</div>
            </div>

            <div className="shelter-section-title">등록된 플레이어</div>
            {self.interactedPlayers.length === 0 && (
              <div className="subtitle">거래해본 플레이어가 없습니다. 거래 상대만 등록할 수 있습니다.</div>
            )}
            {self.interactedPlayers.map((p) => {
              const registered = shelter.registered.includes(p.id)
              return (
                <div key={p.id} className="shelter-player-row">
                  <span>{p.name}</span>
                  <button className="btn" onClick={() => (registered ? onUnregister(p.id) : onRegister(p.id))}>
                    {registered ? '등록 해제' : '등록'}
                  </button>
                </div>
              )
            })}

            <button className="btn btn-danger" style={{ marginTop: 16, width: '100%' }} onClick={onDemolish}>
              쉘터 철거
            </button>
          </>
        ) : (
          <>
            <p className="subtitle">쉘터를 지으면 사망했을 때 기본 위치 대신 이곳에서 되살아날 수 있습니다.</p>
            <div className="shelter-cost">필요 재료: {COST_LABEL}</div>
            {location.canBuildShelterHere ? (
              <>
                <input
                  className="input"
                  placeholder="쉘터 이름 (선택)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ marginTop: 10 }}
                  maxLength={20}
                />
                <button className="btn btn-primary" style={{ marginTop: 10, width: '100%' }} onClick={() => onBuild(name)}>
                  이곳에 쉘터 건설
                </button>
              </>
            ) : (
              <div className="error-text" style={{ marginTop: 10 }}>
                이곳에는 이미 다른 생존자의 쉘터가 있어 건설할 수 없습니다.
              </div>
            )}
          </>
        )}

        <button className="btn" style={{ marginTop: 14, width: '100%' }} onClick={onClose}>
          닫기
        </button>
      </div>
    </div>
  )
}
