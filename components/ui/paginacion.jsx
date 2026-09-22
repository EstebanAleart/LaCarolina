"use client"

// Barra de paginado compartida (se renderiza arriba y abajo de una lista).
// Solo UI: cada vista hace el slice con page/pageSize. sizes por defecto 5/10/20.
export default function Paginacion({ total, page, pageSize, sizes = [5, 10, 20], onPage, onSize }) {
  if (!total) return null
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const desde = (page - 1) * pageSize + 1
  const hasta = Math.min(page * pageSize, total)
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm">
      <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
        Ver
        <select value={pageSize} onChange={(e) => onSize(Number(e.target.value))}
          className="rounded-md border border-input bg-card px-2 py-1.5 text-xs text-card-foreground">
          {sizes.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
        <span>· {desde}–{hasta} de {total}</span>
      </label>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => onPage(Math.max(1, page - 1))} disabled={page === 1}
          className="rounded-md border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary disabled:opacity-40">
          Anterior
        </button>
        <span className="text-xs text-muted-foreground">{page}/{totalPages}</span>
        <button type="button" onClick={() => onPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
          className="rounded-md border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary disabled:opacity-40">
          Siguiente
        </button>
      </div>
    </div>
  )
}
