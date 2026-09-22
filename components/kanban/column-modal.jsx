"use client"

import { useState, useEffect, useMemo } from "react"
import { X } from "lucide-react"

// Modal "Ver más" de una columna del kanban: listado completo con búsqueda y paginado 5/10/20.
// - items: elementos de la columna. - matches(item, q): filtro de búsqueda. - renderRow(item): contenido de la fila.
export default function KanbanColumnModal({ title, items, onClose, onOpen, getId, matches, renderRow }) {
  const [q, setQ] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  useEffect(() => { setPage(1) }, [q, pageSize])
  const list = useMemo(() => {
    const s = q.toLowerCase().trim()
    return s ? items.filter((it) => matches(it, s)) : items
  }, [items, q, matches])
  const totalPages = Math.max(1, Math.ceil(list.length / pageSize))
  const rows = list.slice((page - 1) * pageSize, page * pageSize)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-foreground/20" onClick={onClose} />
      <div className="relative z-10 mx-3 flex max-h-[90dvh] w-full max-w-lg flex-col rounded-lg border border-border bg-card shadow-lg">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="text-base font-bold text-card-foreground">
            {title} <span className="font-normal text-muted-foreground">— {items.length}</span>
          </h3>
          <button onClick={onClose} className="rounded-md p-2 text-muted-foreground hover:bg-secondary" aria-label="Cerrar">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center gap-2 border-b border-border px-4 py-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar..."
            className="min-w-0 flex-1 rounded-md border border-input bg-card px-3 py-2 text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} className="rounded-md border border-input bg-card px-2 py-2 text-xs text-card-foreground">
            {[5, 10, 20].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {rows.length === 0 && <p className="px-4 py-8 text-center text-sm text-muted-foreground">Sin resultados</p>}
          {rows.map((it, i) => (
            <button
              key={getId(it)}
              onClick={() => onOpen?.(it)}
              className="flex w-full items-center gap-3 border-b border-border px-4 py-3 text-left hover:bg-muted/50 last:border-0"
            >
              <span className="w-6 shrink-0 text-xs text-muted-foreground">{(page - 1) * pageSize + i + 1}</span>
              {renderRow(it)}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-2 text-xs text-muted-foreground">
          <span>{list.length ? `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, list.length)} de ${list.length}` : "0 de 0"}</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="rounded-md border border-border px-3 py-2 font-medium text-foreground hover:bg-secondary disabled:opacity-40">Anterior</button>
            <span>{page}/{totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="rounded-md border border-border px-3 py-2 font-medium text-foreground hover:bg-secondary disabled:opacity-40">Siguiente</button>
          </div>
        </div>
      </div>
    </div>
  )
}
