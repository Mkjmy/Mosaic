import './TrackRow.css'
import { WAVE_TYPES } from '../types'
import { Clip } from './Clip'

interface TrackRowProps {
  track: {
    id: number
    name: string
    type: string
    color: string
    volume: number
    pan: number
    muted: boolean
    solo: boolean
    armed: boolean
    clips: any[]
  }
  isSelected: boolean
  isMuted: boolean
  selectedClip: { trackId: number; clipId: number } | null
  onSelect: () => void
  onUpdateTrack: (updates: any) => void
  onAddClip: () => void
  onRemoveTrack: () => void
  onToggleClipCell: (clipId: number, stepIndex: number) => void
  onChangeClipNote: (clipId: number, stepIndex: number) => void
  onRemoveClip: (clipId: number) => void
  onSelectClip: (clipId: number) => void
  onOpenPianoRoll: (clipId: number) => void
}

export const TrackRow = ({
  track,
  isSelected,
  isMuted,
  selectedClip,
  onSelect,
  onUpdateTrack,
  onAddClip,
  onRemoveTrack,
  onToggleClipCell,
  onChangeClipNote,
  onRemoveClip,
  onSelectClip,
  onOpenPianoRoll
}: TrackRowProps) => {
  const getWaveIcon = (type: string) => {
    switch (type) {
      case 'square': return '■'
      case 'triangle': return '▲'
      case 'sawtooth': return '⚡'
      case 'noise': return '♫'
      case 'sine': return '〜'
      default: return '■'
    }
  }

  return (
    <div 
      className={`track-row ${isSelected ? 'selected' : ''}`}
      onClick={onSelect}
    >
      <div className="track-header">
        <div className="track-controls">
          <button 
            className={`control-btn ${track.muted ? 'active' : ''}`}
            onClick={(e) => { e.stopPropagation(); onUpdateTrack({ muted: !track.muted }) }}
            title="Mute"
          >
            M
          </button>
          <button 
            className={`control-btn ${track.solo ? 'active' : ''}`}
            onClick={(e) => { e.stopPropagation(); onUpdateTrack({ solo: !track.solo }) }}
            title="Solo"
          >
            S
          </button>
          <button 
            className={`control-btn ${track.armed ? 'armed' : ''}`}
            onClick={(e) => { e.stopPropagation(); onUpdateTrack({ armed: !track.armed }) }}
            title="Record Arm"
          >
            R
          </button>
        </div>
        <div className="track-info">
          <span className="track-name">{track.name}</span>
          <span className="track-type">{track.type}</span>
        </div>
        <div className="track-settings">
          <select 
            value={track.type}
            onChange={(e) => onUpdateTrack({ type: e.target.value })}
            className="wave-select"
            onClick={(e) => e.stopPropagation()}
          >
            {WAVE_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <input 
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={track.volume}
            onChange={(e) => onUpdateTrack({ volume: Number(e.target.value) })}
            className="volume-slider"
            onClick={(e) => e.stopPropagation()}
            title="Volume"
          />
          <input 
            type="range"
            min="-1"
            max="1"
            step="0.1"
            value={track.pan}
            onChange={(e) => onUpdateTrack({ pan: Number(e.target.value) })}
            className="pan-slider"
            onClick={(e) => e.stopPropagation()}
            title="Pan"
          />
          <button 
            className="add-clip-btn"
            onClick={(e) => { e.stopPropagation(); onAddClip() }}
            title="Add Clip"
          >
            +
          </button>
          <button 
            className="remove-track-btn"
            onClick={(e) => { e.stopPropagation(); onRemoveTrack() }}
            title="Remove Track"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="track-lane">
        {track.clips.map(clip => (
          <Clip
            key={clip.id}
            clip={clip}
            trackColor={track.color}
            trackType={track.type}
            isSelected={selectedClip?.trackId === track.id && selectedClip?.clipId === clip.id}
            isMuted={isMuted}
            onSelect={() => onSelectClip(clip.id)}
            onDelete={() => onRemoveClip(clip.id)}
            onToggleStep={(stepIndex) => onToggleClipCell(clip.id, stepIndex)}
            onChangeNote={(stepIndex) => onChangeClipNote(clip.id, stepIndex)}
            onOpenPianoRoll={() => onOpenPianoRoll(clip.id)}
          />
        ))}
      </div>
    </div>
  )
}