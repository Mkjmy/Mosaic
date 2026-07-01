export const NOTES = ['C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3', 'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5'] as const
export const NOISE_TYPES = ['Kick', 'Snare', 'Hi-hat', 'Tom'] as const
export const STEPS = 32

export const WAVE_TYPES = ['square', 'triangle', 'sawtooth', 'noise', 'sine'] as const
export type WaveType = typeof WAVE_TYPES[number]

export interface Track {
  id: number
  name: string
  type: WaveType
  color: string
  volume: number
  pan: number
  muted: boolean
  solo: boolean
  armed: boolean
  clips: Clip[]
}

export interface Clip {
  id: number
  start: number
  length: number
  pattern: boolean[]
  notes: string[]
  noises: string[]
}

export interface NoteFrequency {
  [key: string]: number
}