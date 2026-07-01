"use client"

import { useState, useEffect } from "react"
import { Package, Plus, X, AlertTriangle, ArrowDownUp, Boxes, Pencil } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  fetchProducts, apiCreateProduct, apiUpdateProduct, apiCreateStockMovement,
  fetchCombos, TIPOS_MOVIMIENTO_STOCK,
} from "@/lib/api"

function fmt(n) {
  return Number(n || 0).toLocaleString("es-AR", { maximumFractionDigits: 0 })
}

export default function StockView() {
  const [tab, setTab] = useState("productos")
  const [products, setProducts] = useState([])
  const [combos, setCombos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNewProduct, setShowNewProduct] = useState(false)
  const [movProduct, setMovProduct] = useState(null) // producto al que se le carga movimiento
  const [editProduct, setEditProduct] = useState(null) // producto en edición

  async function loadData() {
    setLoading(true)
    try {
      const [p, c] = await Promise.all([fetchProducts(), fetchCombos()])
      setProducts(p)
      setCombos(c)
    } catch (err) {
      console.error(err)
      toast.error("Error al cargar stock (¿aplicaste la migración 001?)")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const bajoMinimo = products.filter(p => p.bajo_minimo)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Stock de Cotillón</h1>
          <p className="text-sm text-muted-foreground">Inventario, combos y movimientos</p>
        </div>
        <button
          onClick={() => setShowNewProduct(true)}
          className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" /> Nuevo Producto
        </button>
      </div>

      {/* Aviso de bajo mínimo */}
      {bajoMinimo.length > 0 && (
        <div className="flex items-start gap-2 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            <strong>{bajoMinimo.length}</strong> producto(s) en o bajo el mínimo:{" "}
            {bajoMinimo.map(p => p.nombre).join(", ")}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {[["productos", "Productos", Package], ["combos", "Combos", Boxes]].map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              tab === id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : tab === "productos" ? (
        <ProductsTable products={products} onMov={setMovProduct} onEdit={setEditProduct} />
      ) : (
        <CombosList combos={combos} />
      )}

      {showNewProduct && (
        <NewProductModal onClose={() => setShowNewProduct(false)} onSaved={() => { setShowNewProduct(false); loadData() }} />
      )}
      {movProduct && (
        <MovementModal product={movProduct} onClose={() => setMovProduct(null)} onSaved={() => { setMovProduct(null); loadData() }} />
      )}
      {editProduct && (
        <EditProductModal product={editProduct} onClose={() => setEditProduct(null)} onSaved={() => { setEditProduct(null); loadData() }} />
      )}
    </div>
  )
}

function ProductsTable({ products, onMov, onEdit }) {
  if (!products.length) return <p className="text-sm text-muted-foreground">No hay productos. Cargá uno o aplicá el seed de combos.</p>
  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full text-sm">
        <thead className="bg-secondary/50 text-left text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-3 py-2">Producto</th>
            <th className="px-3 py-2">Código</th>
            <th className="px-3 py-2 text-right">Actual</th>
            <th className="px-3 py-2 text-right">Reservado</th>
            <th className="px-3 py-2 text-right">Disponible</th>
            <th className="px-3 py-2 text-right">Mínimo</th>
            <th className="px-3 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {products.map(p => (
            <tr key={p.id} className={cn("border-t border-border", p.bajo_minimo && "bg-red-50")}>
              <td className="px-3 py-2 font-medium text-foreground">
                {p.bajo_minimo && <AlertTriangle className="inline h-3.5 w-3.5 text-red-600 mr-1" />}
                {p.nombre}
              </td>
              <td className="px-3 py-2 text-muted-foreground">{p.codigo || "—"}</td>
              <td className="px-3 py-2 text-right">{fmt(p.stock_actual)}</td>
              <td className="px-3 py-2 text-right text-amber-700">{fmt(p.stock_reservado)}</td>
              <td className={cn("px-3 py-2 text-right font-semibold", p.bajo_minimo ? "text-red-700" : "text-emerald-700")}>{fmt(p.stock_disponible)}</td>
              <td className="px-3 py-2 text-right text-muted-foreground">{fmt(p.stock_minimo)}</td>
              <td className="px-3 py-2 text-right whitespace-nowrap">
                <button
                  onClick={() => onEdit(p)}
                  className="mr-1 inline-flex items-center gap-1 rounded bg-secondary px-2 py-1 text-xs hover:bg-secondary/70"
                >
                  <Pencil className="h-3 w-3" /> Editar
                </button>
                <button
                  onClick={() => onMov(p)}
                  className="inline-flex items-center gap-1 rounded bg-secondary px-2 py-1 text-xs hover:bg-secondary/70"
                >
                  <ArrowDownUp className="h-3 w-3" /> Movimiento
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CombosList({ combos }) {
  if (!combos.length) return <p className="text-sm text-muted-foreground">No hay combos. Aplicá migrations/001b_seed_combos.sql.</p>
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {combos.map(c => {
        const total = (c.items || []).reduce((s, i) => s + (i.cantidad || 0), 0)
        return (
          <div key={c.id} className="rounded-md border border-border bg-card p-4">
            <div className="flex items-baseline justify-between">
              <h3 className="font-bold text-foreground">{c.nombre}</h3>
              <span className="text-sm text-muted-foreground">${fmt(c.precio)}</span>
            </div>
            <p className="mb-2 text-xs text-muted-foreground">{total} unidades · {(c.items || []).length} productos</p>
            <ul className="space-y-0.5 text-sm">
              {(c.items || []).map(i => (
                <li key={i.id} className="flex justify-between">
                  <span className="text-foreground">{i.product?.nombre || "—"}</span>
                  <span className="text-muted-foreground">×{i.cantidad}</span>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </div>
  )
}

function NewProductModal({ onClose, onSaved }) {
  const [f, setF] = useState({ nombre: "", codigo: "", categoria: "Cotillón", unidad: "unidad", stock_actual: 0, stock_minimo: 0 })
  const [saving, setSaving] = useState(false)
  function ch(e) { const { name, value } = e.target; setF(p => ({ ...p, [name]: value })) }
  async function save() {
    if (!f.nombre.trim()) { toast.error("El nombre es requerido"); return }
    setSaving(true)
    try {
      await apiCreateProduct({ ...f, stock_actual: Number(f.stock_actual) || 0, stock_minimo: Number(f.stock_minimo) || 0 })
      toast.success("Producto creado")
      onSaved()
    } catch (err) { toast.error(err.message || "Error al crear") } finally { setSaving(false) }
  }
  return (
    <Modal title="Nuevo Producto" onClose={onClose}>
      <div className="grid gap-3">
        <Field label="Nombre"><input name="nombre" value={f.nombre} onChange={ch} className={inp} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Código"><input name="codigo" value={f.codigo} onChange={ch} className={inp} /></Field>
          <Field label="Categoría"><input name="categoria" value={f.categoria} onChange={ch} className={inp} /></Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Unidad"><input name="unidad" value={f.unidad} onChange={ch} className={inp} /></Field>
          <Field label="Stock inicial"><input type="number" name="stock_actual" value={f.stock_actual} onChange={ch} className={inp} /></Field>
          <Field label="Mínimo"><input type="number" name="stock_minimo" value={f.stock_minimo} onChange={ch} className={inp} /></Field>
        </div>
      </div>
      <ModalActions onClose={onClose} onSave={save} saving={saving} />
    </Modal>
  )
}

function EditProductModal({ product, onClose, onSaved }) {
  const [f, setF] = useState({
    nombre: product.nombre || "",
    codigo: product.codigo || "",
    categoria: product.categoria || "",
    unidad: product.unidad || "unidad",
    stock_actual: product.stock_actual ?? 0,
    stock_minimo: product.stock_minimo ?? 0,
  })
  const [saving, setSaving] = useState(false)
  function ch(e) { const { name, value } = e.target; setF(p => ({ ...p, [name]: value })) }
  async function save() {
    if (!f.nombre.trim()) { toast.error("El nombre es requerido"); return }
    if (Number(f.stock_actual) < 0) { toast.error("El stock no puede ser negativo"); return }
    setSaving(true)
    try {
      await apiUpdateProduct(product.id, {
        nombre: f.nombre,
        codigo: f.codigo || null,
        categoria: f.categoria || null,
        unidad: f.unidad,
        stock_actual: Number(f.stock_actual),
        stock_minimo: Number(f.stock_minimo) || 0,
      })
      toast.success("Producto actualizado")
      onSaved()
    } catch (err) { toast.error(err.message || "Error al guardar") } finally { setSaving(false) }
  }
  const cambioStock = Number(f.stock_actual) !== product.stock_actual
  return (
    <Modal title={`Editar — ${product.nombre}`} onClose={onClose}>
      <div className="grid gap-3">
        <Field label="Nombre"><input name="nombre" value={f.nombre} onChange={ch} className={inp} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Código"><input name="codigo" value={f.codigo} onChange={ch} className={inp} /></Field>
          <Field label="Categoría"><input name="categoria" value={f.categoria} onChange={ch} className={inp} /></Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Unidad"><input name="unidad" value={f.unidad} onChange={ch} className={inp} /></Field>
          <Field label="Stock actual"><input type="number" name="stock_actual" value={f.stock_actual} onChange={ch} className={inp} /></Field>
          <Field label="Mínimo"><input type="number" name="stock_minimo" value={f.stock_minimo} onChange={ch} className={inp} /></Field>
        </div>
        <p className="text-xs text-muted-foreground">
          Reservado: {fmt(product.stock_reservado)} (no editable; se maneja por reservas).
          {cambioStock && " El cambio de stock actual queda registrado como un ajuste."}
        </p>
      </div>
      <ModalActions onClose={onClose} onSave={save} saving={saving} />
    </Modal>
  )
}

function MovementModal({ product, onClose, onSaved }) {
  const [f, setF] = useState({ tipo: "ingreso", cantidad: "", observacion: "" })
  const [saving, setSaving] = useState(false)
  function ch(e) { const { name, value } = e.target; setF(p => ({ ...p, [name]: value })) }
  async function save() {
    const cant = Number(f.cantidad)
    if (!cant) { toast.error("Cantidad debe ser distinta de 0"); return }
    setSaving(true)
    try {
      await apiCreateStockMovement({ product_id: product.id, tipo: f.tipo, cantidad: cant, observacion: f.observacion })
      toast.success("Movimiento registrado")
      onSaved()
    } catch (err) { toast.error(err.message || "Error en el movimiento") } finally { setSaving(false) }
  }
  return (
    <Modal title={`Movimiento — ${product.nombre}`} onClose={onClose}>
      <p className="mb-3 text-xs text-muted-foreground">
        Actual: {fmt(product.stock_actual)} · Reservado: {fmt(product.stock_reservado)} · Disponible: {fmt(product.stock_disponible)}
      </p>
      <div className="grid gap-3">
        <Field label="Tipo">
          <select name="tipo" value={f.tipo} onChange={ch} className={inp}>
            {TIPOS_MOVIMIENTO_STOCK.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Cantidad (para 'ajuste' podés usar negativo)">
          <input type="number" name="cantidad" value={f.cantidad} onChange={ch} className={inp} />
        </Field>
        <Field label="Observación"><input name="observacion" value={f.observacion} onChange={ch} className={inp} /></Field>
      </div>
      <ModalActions onClose={onClose} onSave={save} saving={saving} />
    </Modal>
  )
}

const inp = "w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="relative w-full max-w-md rounded-lg border border-border bg-card shadow-lg">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h3 className="text-sm font-bold text-card-foreground">{title}</h3>
          <button onClick={onClose} className="rounded p-1 text-muted-foreground hover:bg-secondary"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

function ModalActions({ onClose, onSave, saving }) {
  return (
    <div className="mt-5 flex justify-end gap-2">
      <button onClick={onClose} className="rounded-md px-4 py-2 text-sm text-muted-foreground hover:bg-secondary">Cancelar</button>
      <button onClick={onSave} disabled={saving} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
        {saving ? "Guardando…" : "Guardar"}
      </button>
    </div>
  )
}
