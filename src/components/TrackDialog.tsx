import './TrackDialog.css'

interface TrackDialogProps {
  onClose: () => void
  onCreateTrack: (type: 'audio' | 'midi') => void
}

export const TrackDialog = ({ onClose, onCreateTrack }: TrackDialogProps) => {
  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h3>Create Track</h3>
          <button className="dialog-close" onClick={onClose}>✕</button>
        </div>
        <div className="dialog-content">
          <button className="dialog-option" onClick={() => onCreateTrack('audio')}>
            <div className="dialog-option-icon">🎵</div>
            <div className="dialog-option-text">
              <div className="dialog-option-title">Audio Track</div>
              <div className="dialog-option-desc">For recording and editing audio clips</div>
            </div>
          </button>
          <button className="dialog-option" onClick={() => onCreateTrack('midi')}>
            <div className="dialog-option-icon">🎹</div>
            <div className="dialog-option-text">
              <div className="dialog-option-title">MIDI Track</div>
              <div className="dialog-option-desc">For MIDI instruments and virtual synths</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}