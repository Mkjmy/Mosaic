import { useState } from 'react'
import './MidiKeyboard.css'
import { NOTES } from '../types'

interface MidiKeyboardProps {
  onNoteOn: (note: string) => void
  onNoteOff: (note: string) => void
}

const WHITE_KEYS = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
const BLACK_KEYS = ['C#', 'D#', null, 'F#', 'G#', 'A#', null]

export const MidiKeyboard = ({ onNoteOn, onNoteOff }: MidiKeyboardProps) => {
  const [activeNotes, setActiveNotes] = useState<Set<string>>(new Set())

  const handleNoteOn = (note: string) => {
    setActiveNotes(prev => new Set(prev).add(note))
    onNoteOn(note)
  }

  const handleNoteOff = (note: string) => {
    setActiveNotes(prev => {
      const newSet = new Set(prev)
      newSet.delete(note)
      return newSet
    })
    onNoteOff(note)
  }

  return (
    <div className="midi-keyboard">
      <div className="midi-keys">
        {NOTES.map((note) => {
          const noteName = note.slice(0, -1)
          const octave = note.slice(-1)
          const isBlack = noteName.includes('#')
          
          return (
            <div
              key={note}
              className={`midi-key ${isBlack ? 'black' : 'white'} ${activeNotes.has(note) ? 'active' : ''}`}
              onMouseDown={() => handleNoteOn(note)}
              onMouseUp={() => handleNoteOff(note)}
              onMouseLeave={() => handleNoteOff(note)}
            >
              <span className="note-label">{note}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}