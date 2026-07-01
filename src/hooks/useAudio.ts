import { useRef, useCallback } from 'react'
import { NOTES, NOISE_TYPES, type WaveType, type NoteFrequency } from '../types'

export const useAudio = () => {
  const audioContextRef = useRef<AudioContext | null>(null)

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    return audioContextRef.current
  }, [])

  const noteFrequencies: NoteFrequency = {
    'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61,
    'G3': 196.00, 'A3': 220.00, 'B3': 246.94, 'C4': 261.63,
    'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00,
    'A4': 440.00, 'B4': 493.88, 'C5': 523.25, 'D5': 587.33
  }

  const playNote = useCallback((note: string, waveType: WaveType, volume: number, pan: number) => {
    const audioContext = getAudioContext()
    
    if (waveType === 'noise') {
      playNoise(note, audioContext, volume)
      return
    }

    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    const pannerNode = audioContext.createStereoPanner()

    oscillator.type = waveType as OscillatorType
    oscillator.frequency.value = noteFrequencies[note] || 440

    oscillator.connect(gainNode)
    gainNode.connect(pannerNode)
    pannerNode.connect(audioContext.destination)

    pannerNode.pan.value = pan
    gainNode.gain.setValueAtTime(0.12 * volume, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.15)
  }, [getAudioContext])

  const playNoise = useCallback((noiseType: string, audioContext: AudioContext, volume: number) => {
    const bufferSize = audioContext.sampleRate * 0.1
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate)
    const data = buffer.getChannelData(0)

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1
    }

    const noise = audioContext.createBufferSource()
    noise.buffer = buffer

    const gainNode = audioContext.createGain()
    const filterNode = audioContext.createBiquadFilter()

    noise.connect(filterNode)
    filterNode.connect(gainNode)
    gainNode.connect(audioContext.destination)

    if (noiseType === 'Kick') {
      filterNode.type = 'lowpass'
      filterNode.frequency.setValueAtTime(150, audioContext.currentTime)
      filterNode.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.1)
      gainNode.gain.setValueAtTime(0.8 * volume, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
    } else if (noiseType === 'Snare') {
      filterNode.type = 'highpass'
      filterNode.frequency.setValueAtTime(1000, audioContext.currentTime)
      gainNode.gain.setValueAtTime(0.4 * volume, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.08)
    } else if (noiseType === 'Hi-hat') {
      filterNode.type = 'highpass'
      filterNode.frequency.setValueAtTime(7000, audioContext.currentTime)
      gainNode.gain.setValueAtTime(0.15 * volume, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05)
    } else {
      filterNode.type = 'bandpass'
      filterNode.frequency.setValueAtTime(300, audioContext.currentTime)
      gainNode.gain.setValueAtTime(0.5 * volume, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
    }

    noise.start(audioContext.currentTime)
    noise.stop(audioContext.currentTime + 0.1)
  }, [])

  return { playNote, getAudioContext }
}