export default function EventChoicePanel({ event, onChoose, pending }) {
  return (
    <div className="modal-backdrop">
      <div className="panel modal event-choice-panel">
        <p className="event-choice-prompt">{event.prompt}</p>
        <div className="event-choice-options">
          {event.choices.map((c) => (
            <button key={c.id} className="btn btn-primary" disabled={pending} onClick={() => onChoose(c.id)}>
              {c.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
