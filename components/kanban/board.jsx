"use client"

import { useRef, useState } from "react"
import { cn } from "@/lib/utils"

const SIZES = [5, 10, 20]
const CARD_REM = 5.75 // alto aprox. de una tarjeta + separación

// Tablero kanban compartido (Leads, Eventos).
// - Columnas fijas; cada una muestra `size` tarjetas (5/10/20) y su alto se ajusta a esa cantidad.
// - Arrastrar una tarjeta a otra columna llama onMove(id, columnKey). Con mouse; en touch se cambia desde la ficha.
// - Arrastrar el fondo del tablero con el mouse lo desplaza a los lados y arriba/abajo.
// - "Ver N más →" llama onMore(column).
export default function KanbanBoard({ columns, renderCard, getId, onMove, onMore, size = 5, onSizeChange, emptyText = "Sin elementos" }) {
  const pan = useRef(null)
  const [over, setOver] = useState(null)

  const onDown = (e) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return
    if (e.target.closest('[draggable="true"]')) return // eso es arrastre de tarjeta, no del tablero
    const main = e.currentTarget.closest("main")
    pan.current = { x: e.clientX, y: e.clientY, left: e.currentTarget.scrollLeft, top: main ? main.scrollTop : 0, main }
  }
  const onMoveBoard = (e) => {
    const d = pan.current
    if (!d) return
    e.currentTarget.scrollLeft = d.left - (e.clientX - d.x)
    if (d.main) d.main.scrollTop = d.top - (e.clientY - d.y)
  }
  const onUp = () => { pan.current = null }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-end gap-1.5 text-xs text-muted-foreground">
        Tarjetas por columna
        {SIZES.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onSizeChange?.(n)}
            className={cn(
              "rounded-md border px-2.5 py-1.5 font-medium",
              size === n ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:bg-secondary"
            )}
          >
            {n}
          </button>
        ))}
      </div>

      <div
        className="flex gap-3 overflow-x-auto scrollbar-none pb-4 items-stretch cursor-grab active:cursor-grabbing select-none"
        onPointerDown={onDown}
        onPointerMove={onMoveBoard}
        onPointerUp={onUp}
        onPointerLeave={onUp}
        onPointerCancel={onUp}
      >
        {columns.map((c) => {
          const visible = c.items.slice(0, size)
          const hidden = c.items.length - visible.length
          return (
            <div
              key={c.key}
              onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; if (over !== c.key) setOver(c.key) }}
              onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setOver(null) }}
              onDrop={(e) => {
                e.preventDefault()
                setOver(null)
                const id = e.dataTransfer.getData("text/plain")
                if (id) onMove?.(id, c.key)
              }}
              className={cn(
                "flex w-64 shrink-0 flex-col rounded-lg border bg-secondary/50 transition-colors",
                over === c.key ? "border-primary ring-2 ring-primary/30" : "border-border"
              )}
            >
              <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
                <span className="text-xs font-semibold text-foreground">{c.title}</span>
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/10 px-1 text-[10px] font-bold text-primary">{c.items.length}</span>
              </div>
              {/* Sin scroll interno: la columna mide lo que miden sus tarjetas (todas parejas por items-stretch) */}
              <div className="flex flex-1 flex-col gap-2 p-2" style={{ minHeight: `${Math.min(size, 5) * CARD_REM + 1}rem` }}>
                {visible.map((item) => (
                  <div
                    key={getId(item)}
                    draggable
                    onDragStart={(e) => { e.dataTransfer.setData("text/plain", String(getId(item))); e.dataTransfer.effectAllowed = "move" }}
                    className="cursor-grab active:cursor-grabbing"
                  >
                    {renderCard(item)}
                  </div>
                ))}
                {c.items.length === 0 && <p className="py-4 text-center text-xs text-muted-foreground">{emptyText}</p>}
                {hidden > 0 && (
                  <button type="button" onClick={() => onMore?.(c)} className="mt-auto rounded-md py-2.5 text-xs font-medium text-primary hover:bg-primary/10">
                    Ver {hidden} más →
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
