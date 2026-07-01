import { useState, useRef, useEffect } from 'react'
import './PianoRoll.css'
import { NOTES } from '../types'

interface PianoRollProps {
  notes: boolean[][]
  onNotesChange: (notes: boolean[][]) => void
  onClose: () => void
  clipLength: number
}

export const PianoRoll = ({ notes, onNotesChange, onClose, clipLength }: PianoRollProps) => {
  const [isDrawing, setIsDrawing] = useState(false)
  const [isErasing, setIsErasing] = useState(false)
  const [startCell, setStartCell] = useState<{ row: number; col: number } | null>(null)
  const [position, setPosition] = useState({ x: 200, y: 100 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const windowRef = useRef<HTMLDivElement>(null)

  const COLS = clipLength
  const ROWS = NOTES.length

  const handleWindowMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only allow dragging from header
    if (!e.target.closest('.piano-roll-header')) return
    if (e.target.closest('.piano-roll-controls')) return
    
    setIsDragging(true)
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    })
  }

  const handleWindowMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      })
    }
  }

  const handleWindowMouseUp = () => {
    setIsDragging(false)
  }

  // Add global mouse up to handle dragging outside window
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false)
      setIsDrawing(false)
      setStartCell(null)
    }

    window.addEventListener('mouseup', handleGlobalMouseUp)
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp)
  }, [])

  const drawPianoRoll = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const cellWidth = canvas.width / COLS
    const cellHeight = canvas.height / ROWS

    // Clear canvas
    ctx.fillStyle = '#1d1d1d'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw grid
    ctx.strokeStyle = '#2d2d2d'
    ctx.lineWidth = 1

    for (let i = 0; i <= COLS; i++) {
      ctx.beginPath()
      ctx.moveTo(i * cellWidth, 0)
      ctx.lineTo(i * cellWidth, canvas.height)
      ctx.stroke()
    }

    for (let i = 0; i <= ROWS; i++) {
      ctx.beginPath()
      ctx.moveTo(0, i * cellHeight)
      ctx.lineTo(canvas.width, i * cellHeight)
      ctx.stroke()
    }

    // Draw notes
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        if (notes[row][col]) {
          ctx.fillStyle = '#ff764d'
          ctx.fillRect(col * cellWidth + 1, row * cellHeight + 1, cellWidth - 2, cellHeight - 2)
        }
      }
    }
  }

  useEffect(() => {
    drawPianoRoll()
  }, [notes, clipLength])

  const getCellFromCoords = (x: number, y: number) => {
    const canvas = canvasRef.current
    if (!canvas) return null

    const rect = canvas.getBoundingClientRect()
    const cellWidth = canvas.width / COLS
    const cellHeight = canvas.height / ROWS

    const col = Math.floor((x - rect.left) / (rect.width / COLS))
    const row = Math.floor((y - rect.top) / (rect.height / ROWS))

    if (col >= 0 && col < COLS && row >= 0 && row < ROWS) {
      return { row, col }
    }
    return null
  }

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.stopPropagation() // Prevent window drag
    const cell = getCellFromCoords(e.clientX, e.clientY)
    if (cell) {
      setIsDrawing(true)
      setIsErasing(notes[cell.row][cell.col])
      setStartCell(cell)
      
      const newNotes = notes.map(row => [...row])
      newNotes[cell.row][cell.col] = !newNotes[cell.row][cell.col]
      onNotesChange(newNotes)
    }
  }

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.stopPropagation() // Prevent window drag
    
    if (!isDrawing || !startCell) return

    const cell = getCellFromCoords(e.clientX, e.clientY)
    if (cell) {
      const newNotes = notes.map(row => [...row])
      
      // Draw/erase notes - allow multiple notes per column (polyphony)
      const minRow = Math.min(startCell.row, cell.row)
      const maxRow = Math.max(startCell.row, cell.row)
      const minCol = Math.min(startCell.col, cell.col)
      const maxCol = Math.max(startCell.col, cell.col)

      for (let row = minRow; row <= maxRow; row++) {
        for (let col = minCol; col <= maxCol; col++) {
          newNotes[row][col] = !isErasing
        }
      }
      
      onNotesChange(newNotes)
    }
  }

  const handleCanvasMouseUp = () => {
    setIsDrawing(false)
    setStartCell(null)
  }

  const clearAll = () => {
    const emptyNotes = Array(ROWS).fill(null).map(() => Array(COLS).fill(false))
    onNotesChange(emptyNotes)
  }

  return (
    <div
      ref={windowRef}
      className="piano-roll-window"
      style={{ left: position.x, top: position.y }}
      onMouseDown={handleWindowMouseDown}
      onMouseMove={handleWindowMouseMove}
      onMouseUp={handleWindowMouseUp}
    >
      <div className="piano-roll-header">
        <h3>Piano Roll</h3>
        <div className="piano-roll-controls">
          <button className="piano-roll-btn" onClick={clearAll}>Clear</button>
          <button className="piano-roll-btn" onClick={onClose}>✕</button>
        </div>
      </div>
      <div className="piano-roll-body">
        <div className="piano-keys">
          {NOTES.map((note, index) => (
            <div key={note} className="piano-key">
              <span className="piano-key-label">{note}</span>
            </div>
          ))}
        </div>
        <canvas
          ref={canvasRef}
          width={640}
          height={320}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
        />
      </div>
      <div className="piano-roll-footer">
        <p>Click & drag to draw notes • Polyphony enabled</p>
      </div>
    </div>
  )
}
