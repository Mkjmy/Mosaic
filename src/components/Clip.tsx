import './Clip.css'
import { NOTES, NOISE_TYPES, STEPS } from '../types'

interface ClipProps {
  clip: {
    id: number
    start: number
    length: number
    pattern: boolean[]
    notes: string[]
    noises: string[]
  }
  trackColor: string
  trackType: string
  isSelected: boolean
  isMuted: boolean
  onSelect: () => void
  onDelete: () => void
  onToggleStep: (stepIndex: number) => void
  onChangeNote: (stepIndex: number) => void
  onOpenPianoRoll: () => void
}

export const Clip = ({
  clip,
  trackColor,
  trackType,
  isSelected,
  isMuted,
  onSelect,
  onDelete,
  onToggleStep,
  onChangeNote,
  onOpenPianoRoll
}: ClipProps) => {
  return (
    <div
      className={`clip ${isSelected ? 'selected' : ''}`}
      style={{
        left: `${(clip.start / STEPS) * 100}%`,
        width: `${(clip.length / STEPS) * 100}%`,
        background: trackColor,
        opacity: isMuted ? 0.3 : 1
      }}
      onClick={onSelect}
      onContextMenu={(e) => {
        e.preventDefault()
        if (confirm('Delete this clip?')) {
          onDelete()
        }
      }}
    >
      <div className="clip-header">
        <span className="clip-name">Clip {clip.id.toString().slice(-4)}</span>
        <button 
          className="clip-edit-btn"
          onClick={(e) => {
            e.stopPropagation()
            onOpenPianoRoll()
          }}
          title="Open Piano Roll"
        >
          🎹
        </button>
        <button 
          className="clip-close"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
        >
          ✕
        </button>
      </div>
      <div className="clip-pattern">
        {clip.pattern.map((active, i) => (
          <div
            key={i}
            className={`clip-step ${active ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              onToggleStep(i)
            }}
            onContextMenu={(e) => {
              e.preventDefault()
              onChangeNote(i)
            }}
            title={trackType === 'noise' ? clip.noises[i] : clip.notes[i]}
          >
            {active && (
              <span className="note-label">
                {trackType === 'noise' ? clip.noises[i] : clip.notes[i]}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}