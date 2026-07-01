import { useState, useRef, useEffect } from 'react'
import './App.css'
import { TrackDialog } from './components/TrackDialog'
import { TrackRow } from './components/TrackRow'
import { MidiKeyboard } from './components/MidiKeyboard'
import { PianoRoll } from './components/PianoRoll'
import { useAudio } from './hooks/useAudio'
import { NOTES, NOISE_TYPES, STEPS, WAVE_TYPES, type Track, type Clip } from './types'

function App() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [tempo, setTempo] = useState(120)
  const [tracks, setTracks] = useState<Track[]>([])
  const [selectedTrack, setSelectedTrack] = useState<number | null>(null)
  const [selectedClip, setSelectedClip] = useState<{ trackId: number; clipId: number } | null>(null)
  const [loopEnabled, setLoopEnabled] = useState(true)
  const [loopStart, setLoopStart] = useState(0)
  const [loopEnd, setLoopEnd] = useState(STEPS)
  const [showTrackDialog, setShowTrackDialog] = useState(false)
  const [showMidiKeyboard, setShowMidiKeyboard] = useState(false)
  const [showPianoRoll, setShowPianoRoll] = useState(false)
  const [editingClip, setEditingClip] = useState<{ trackId: number; clipId: number } | null>(null)
  
  const audioContextRef = useRef<AudioContext | null>(null)
  const intervalRef = useRef<number | null>(null)
  const tracksRef = useRef(tracks)
  const recordingStartTimeRef = useRef<number | null>(null)
  const recordingClipRef = useRef<Clip | null>(null)

  const { playNote, getAudioContext } = useAudio()

  useEffect(() => {
    tracksRef.current = tracks
  }, [tracks])

  const isTrackMuted = (track: Track) => {
    if (track.solo) return false
    if (tracks.some(t => t.solo && t.id !== track.id)) return true
    return track.muted
  }

  const startPlayback = () => {
    const audioContext = getAudioContext()
    if (audioContext.state === 'suspended') {
      audioContext.resume()
    }
    
    setIsPlaying(true)
    if (currentStep === 0) {
      setCurrentStep(loopStart)
    }
  }

  const stopPlayback = () => {
    setIsPlaying(false)
    setIsRecording(false)
    setCurrentStep(0)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    recordingStartTimeRef.current = null
    recordingClipRef.current = null
  }

  const startRecording = () => {
    const armedTrack = tracks.find(t => t.armed)
    if (!armedTrack) {
      alert('Please arm a track first (click the R button)')
      return
    }

    const audioContext = getAudioContext()
    if (audioContext.state === 'suspended') {
      audioContext.resume()
    }

    setIsRecording(true)
    recordingStartTimeRef.current = currentStep

    const newClip: Clip = {
      id: Date.now(),
      start: currentStep,
      length: 0,
      pattern: Array(STEPS).fill(false),
      notes: Array(STEPS).fill('C4'),
      noises: Array(STEPS).fill('Kick')
    }

    recordingClipRef.current = newClip

    setTracks(tracks.map(t => 
      t.id === armedTrack.id 
        ? { ...t, clips: [...t.clips, newClip] }
        : t
    ))

    if (!isPlaying) {
      startPlayback()
    }
  }

  const stopRecording = () => {
    if (!isRecording || !recordingClipRef.current) return

    setIsRecording(false)
    const finalClip = { ...recordingClipRef.current }
    recordingClipRef.current = null
    recordingStartTimeRef.current = null

    setTracks(tracks.map(t => ({
      ...t,
      clips: t.clips.map(c => c.id === finalClip.id ? finalClip : c)
    })))
  }

  useEffect(() => {
    if (isPlaying) {
      const interval = (60 / tempo) * 1000 / 4
      
      intervalRef.current = window.setInterval(() => {
        setCurrentStep((prev) => {
          let nextStep = prev + 1

          if (loopEnabled && nextStep >= loopEnd) {
            nextStep = loopStart
          } else if (nextStep >= STEPS) {
            nextStep = 0
          }

          tracksRef.current.forEach(track => {
            if (isTrackMuted(track)) return

            track.clips.forEach(clip => {
              const clipRelativeStep = nextStep - clip.start
              if (clipRelativeStep >= 0 && clipRelativeStep < clip.length) {
                // Check for polyphonic notes
                const polyphonicNotes = (clip as any).polyphonicNotes
                if (polyphonicNotes && polyphonicNotes[clipRelativeStep]?.length > 0) {
                  // Play all notes in this step (polyphony)
                  polyphonicNotes[clipRelativeStep].forEach((note: string) => {
                    playNote(note, track.type, track.volume / polyphonicNotes[clipRelativeStep].length, track.pan)
                  })
                } else if (clip.pattern[clipRelativeStep]) {
                  // Fallback to single note
                  if (track.type === 'noise') {
                    playNote(clip.noises[clipRelativeStep], track.type, track.volume, track.pan)
                  } else {
                    playNote(clip.notes[clipRelativeStep], track.type, track.volume, track.pan)
                  }
                }
              }
            })
          })

          return nextStep
        })
      }, interval)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isPlaying, tempo, loopEnabled, loopStart, loopEnd, playNote, tracks])

  const createTrack = (type: 'audio' | 'midi') => {
    const newId = tracks.length > 0 ? Math.max(...tracks.map(t => t.id)) + 1 : 0
    const colors = ['#FF004D', '#FFA300', '#00E436', '#29ADFF', '#FF77A8', '#83769C']
    
    let waveType = 'square'
    let trackName = 'Audio Track'
    
    if (type === 'midi') {
      waveType = 'square'
      trackName = 'MIDI Track'
    } else {
      waveType = 'sawtooth'
      trackName = 'Audio Track'
    }
    
    const newTrack: Track = {
      id: newId,
      name: trackName,
      type: waveType,
      color: colors[newId % colors.length],
      volume: 0.8,
      pan: 0,
      muted: false,
      solo: false,
      armed: false,
      clips: []
    }
    setTracks([...tracks, newTrack])
    setShowTrackDialog(false)
  }

  const updateTrack = (trackId: number, updates: Partial<Track>) => {
    setTracks(tracks.map(t => t.id === trackId ? { ...t, ...updates } : t))
  }

  const addClip = (trackId: number) => {
    const newClip: Clip = {
      id: Date.now(),
      start: currentStep,
      length: 8,
      pattern: Array(8).fill(false),
      notes: Array(8).fill('C4'),
      noises: Array(8).fill('Kick')
    }

    setTracks(tracks.map(t => 
      t.id === trackId 
        ? { ...t, clips: [...t.clips, newClip] }
        : t
    ))
  }

  const removeClip = (trackId: number, clipId: number) => {
    setTracks(tracks.map(t => ({
      ...t,
      clips: t.clips.filter(c => c.id !== clipId)
    })))
  }

  const toggleClipCell = (trackId: number, clipId: number, stepIndex: number) => {
    const track = tracks.find(t => t.id === trackId)
    if (!track) return

    const clip = track.clips.find(c => c.id === clipId)
    if (!clip) return

    const newPattern = [...clip.pattern]
    newPattern[stepIndex] = !newPattern[stepIndex]

    if (newPattern[stepIndex]) {
      if (track.type === 'noise') {
        playNote(clip.noises[stepIndex], track.type, track.volume, track.pan)
      } else {
        playNote(clip.notes[stepIndex], track.type, track.volume, track.pan)
      }
    }

    updateClip(trackId, clipId, { pattern: newPattern })
  }

  const updateClip = (trackId: number, clipId: number, updates: Partial<Clip>) => {
    setTracks(tracks.map(t => ({
      ...t,
      clips: t.clips.map(c => c.id === clipId ? { ...c, ...updates } : c)
    })))
  }

  const changeClipNote = (trackId: number, clipId: number, stepIndex: number) => {
    const track = tracks.find(t => t.id === trackId)
    if (!track) return

    const clip = track.clips.find(c => c.id === clipId)
    if (!clip) return

    if (track.type === 'noise') {
      const currentNoiseIndex = NOISE_TYPES.indexOf(clip.noises[stepIndex])
      const nextNoiseIndex = (currentNoiseIndex + 1) % NOISE_TYPES.length
      const newNoises = [...clip.noises]
      newNoises[stepIndex] = NOISE_TYPES[nextNoiseIndex]
      updateClip(trackId, clipId, { noises: newNoises })

      if (clip.pattern[stepIndex]) {
        playNote(NOISE_TYPES[nextNoiseIndex], track.type, track.volume, track.pan)
      }
    } else {
      const currentNoteIndex = NOTES.indexOf(clip.notes[stepIndex])
      const nextNoteIndex = (currentNoteIndex + 1) % NOTES.length
      const newNotes = [...clip.notes]
      newNotes[stepIndex] = NOTES[nextNoteIndex]
      updateClip(trackId, clipId, { notes: newNotes })

      if (clip.pattern[stepIndex]) {
        playNote(NOTES[nextNoteIndex], track.type, track.volume, track.pan)
      }
    }
  }

  const handleMidiNoteOn = (note: string) => {
    if (showMidiKeyboard && selectedTrack !== null) {
      const track = tracks.find(t => t.id === selectedTrack)
      if (track && !isTrackMuted(track)) {
        playNote(note, track.type, track.volume, track.pan)
      }
    }
  }

  const handleMidiNoteOff = (note: string) => {
    // Note off logic if needed
  }

  const openPianoRoll = (trackId: number, clipId: number) => {
    setEditingClip({ trackId, clipId })
    setShowPianoRoll(true)
  }

  const closePianoRoll = () => {
    setShowPianoRoll(false)
    setEditingClip(null)
  }

  const handlePianoRollNotesChange = (newNotes: boolean[][]) => {
    if (!editingClip) return

    setTracks(tracks.map(track => {
      if (track.id === editingClip.trackId) {
        return {
          ...track,
          clips: track.clips.map(clip => {
            if (clip.id === editingClip.clipId) {
              // For polyphony, store all active notes for each step
              // Convert 2D grid to array of note arrays per step
              const notesPerStep: string[][] = Array(clip.length).fill(null).map(() => [])
              
              for (let col = 0; col < clip.length; col++) {
                for (let row = 0; row < NOTES.length; row++) {
                  if (newNotes[row][col]) {
                    notesPerStep[col].push(NOTES[row])
                  }
                }
              }
              
              // Store polyphonic notes as a custom property
              return { 
                ...clip, 
                polyphonicNotes: notesPerStep,
                // Keep single-note pattern for backward compatibility
                pattern: notesPerStep.map(notes => notes.length > 0),
                notes: notesPerStep.map(notes => notes[0] || 'C4')
              }
            }
            return clip
          })
        }
      }
      return track
    }))
  }

  return (
    <>
      <div className="app">
        <div className="header">
          <h1>8-BIT DAW</h1>
          <div className="header-controls">
            <button 
              className={`btn btn-record ${isRecording ? 'recording' : ''}`}
              onClick={isRecording ? stopRecording : startRecording}
            >
              {isRecording ? '● Stop' : '● Record'}
            </button>
            <button 
              className={`btn btn-primary ${isPlaying ? 'btn-play playing' : ''}`}
              onClick={isPlaying ? stopPlayback : startPlayback}
            >
              {isPlaying ? '■ Stop' : '▶ Play'}
            </button>
            <button className="btn" onClick={() => setCurrentStep(0)}>
              ⏮ Start
            </button>
            <button className="btn" onClick={() => setShowTrackDialog(true)}>
              + Track
            </button>
            <button className="btn" onClick={() => setShowMidiKeyboard(!showMidiKeyboard)}>
              🎹
            </button>
          </div>
        </div>

        {showTrackDialog && (
          <TrackDialog 
            onClose={() => setShowTrackDialog(false)}
            onCreateTrack={createTrack}
          />
        )}

        <div className="transport">
          <div className="transport-section">
            <span className="transport-label">BPM</span>
            <input 
              type="range" 
              min="60" 
              max="200" 
              value={tempo}
              onChange={(e) => setTempo(Number(e.target.value))}
              className="slider"
            />
            <span style={{ color: '#888', fontSize: '0.85rem', minWidth: '30px' }}>{tempo}</span>
          </div>

          <div className="transport-section">
            <div className="loop-toggle">
              <input 
                type="checkbox" 
                checked={loopEnabled}
                onChange={(e) => setLoopEnabled(e.target.checked)}
                id="loop"
              />
              <label htmlFor="loop">Loop</label>
            </div>
            {loopEnabled && (
              <div className="loop-inputs">
                <input 
                  type="number" 
                  min="0" 
                  max={STEPS} 
                  value={loopStart}
                  onChange={(e) => setLoopStart(Number(e.target.value))}
                  className="loop-input"
                />
                <span style={{ color: '#666' }}>-</span>
                <input 
                  type="number" 
                  min="0" 
                  max={STEPS} 
                  value={loopEnd}
                  onChange={(e) => setLoopEnd(Number(e.target.value))}
                  className="loop-input"
                />
              </div>
            )}
          </div>

          <div className="position-display">
            {currentStep.toString().padStart(2, '0')}:{STEPS}
          </div>
        </div>

        <div className="timeline">
          <div className="timeline-ruler">
            {Array.from({ length: STEPS }).map((_, i) => (
              <div 
                key={i} 
                className={`ruler-mark ${currentStep === i ? 'current' : ''} ${i % 4 === 0 ? 'beat' : ''}`}
                style={{ left: `${(i / STEPS) * 100}%` }}
              />
            ))}
          </div>

          <div className="tracks-container">
            {tracks.length === 0 ? (
              <div className="empty-state">
                <p>No tracks in this project.</p>
                <p>Click "+ Track" to create your first track.</p>
              </div>
            ) : (
              tracks.map((track) => (
                <TrackRow
                  key={track.id}
                  track={track}
                  isSelected={selectedTrack === track.id}
                  isMuted={isTrackMuted(track)}
                  selectedClip={selectedClip}
                  onSelect={() => setSelectedTrack(track.id)}
                  onUpdateTrack={(updates) => updateTrack(track.id, updates)}
                  onAddClip={() => addClip(track.id)}
                  onRemoveTrack={() => setTracks(tracks.filter(t => t.id !== track.id))}
                  onToggleClipCell={(clipId, stepIndex) => toggleClipCell(track.id, clipId, stepIndex)}
                  onChangeClipNote={(clipId, stepIndex) => changeClipNote(track.id, clipId, stepIndex)}
                  onRemoveClip={(clipId) => removeClip(track.id, clipId)}
                  onSelectClip={(clipId) => setSelectedClip({ trackId: track.id, clipId })}
                  onOpenPianoRoll={(clipId) => openPianoRoll(track.id, clipId)}
                />
              ))
            )}
          </div>
        </div>

        <div className="footer">
          <p>Click R to arm track • REC to record • Click clip to edit • Right-click to change note</p>
        </div>
      </div>

      {showMidiKeyboard && (
        <MidiKeyboard 
          onNoteOn={handleMidiNoteOn}
          onNoteOff={handleMidiNoteOff}
        />
      )}

      {showPianoRoll && editingClip && (
        <PianoRoll
          notes={(() => {
            const track = tracks.find(t => t.id === editingClip.trackId)
            const clip = track?.clips.find(c => c.id === editingClip.clipId)
            if (!clip) return Array(NOTES.length).fill(null).map(() => Array(STEPS).fill(false))
            
            // Convert to 2D grid, handling polyphonic notes
            const grid = Array(NOTES.length).fill(null).map(() => Array(clip.length).fill(false))
            
            const polyphonicNotes = (clip as any).polyphonicNotes
            if (polyphonicNotes) {
              // Load from polyphonic notes
              polyphonicNotes.forEach((notesInStep: string[], step: number) => {
                notesInStep.forEach((note: string) => {
                  const noteIndex = NOTES.indexOf(note)
                  if (noteIndex >= 0) {
                    grid[noteIndex][step] = true
                  }
                })
              })
            } else {
              // Fallback to single-note pattern
              clip.pattern.forEach((active, step) => {
                if (active) {
                  const noteIndex = NOTES.indexOf(clip.notes[step])
                  if (noteIndex >= 0) {
                    grid[noteIndex][step] = true
                  }
                }
              })
            }
            
            return grid
          })()}
          onNotesChange={handlePianoRollNotesChange}
          onClose={closePianoRoll}
          clipLength={(() => {
            const track = tracks.find(t => t.id === editingClip.trackId)
            const clip = track?.clips.find(c => c.id === editingClip.clipId)
            return clip?.length || 8
          })()}
        />
      )}
    </>
  )
}

export default App