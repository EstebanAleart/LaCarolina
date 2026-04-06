"use client"

import { useState } from "react"
import { X, Printer, Download } from "lucide-react"
import { cn } from "@/lib/utils"

export function PrintableContract({ proposal: p, lead, onClose }) {
  const [editMode, setEditMode] = useState(true)
  const [formData, setFormData] = useState({
    cliente_nombre: lead?.nombre || p.lead?.nombre || "",
    cliente_dni: p.dni || lead?.telefono || "",
    cliente_direccion: p.direccion || "",
    cliente_email: lead?.email || "",
    cliente_telefono: lead?.telefono || "",
    fecha_evento: p.fecha_evento || "",
    tipo_evento: p.tipo_evento || "",
    invitados: p.invitados_estimados || "",
    valor_seña: p.precio_senia ? `$${Number(p.precio_senia).toLocaleString("es-AR")}` : "",
    valor_total: p.valor_total_evento ? `$${Number(p.valor_total_evento).toLocaleString("es-AR")}` : "",
    servicios_base: (p.servicios_base || []).join(", "),
    adicionales_texto: (p.adicionales || [])
      .map(a => {
        const elegida = a.opciones?.find((_, idx) => idx === a.opcion_elegida)
        return `${a.nombre}: ${elegida?.descripcion || "Sin seleccionar"}`
      })
      .join("\n"),
    notas: p.contenido_html || "",
    menu: p.menu_seleccionado || "",
    minimo_tarjetas: p.minimo_tarjetas || "",
    valor_adulto: p.valor_tarjeta_adulto ? `$${Number(p.valor_tarjeta_adulto).toLocaleString("es-AR")}` : "",
    valor_adolescente: p.valor_tarjeta_adolescente ? `$${Number(p.valor_tarjeta_adolescente).toLocaleString("es-AR")}` : "",
    valor_nino: p.valor_tarjeta_nino ? `$${Number(p.valor_tarjeta_nino).toLocaleString("es-AR")}` : "",
  })

  function handleChange(e) {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  function handlePrint() {
    window.print()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[95vh] flex flex-col bg-card rounded-lg border border-border shadow-xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-secondary/30">
          <div>
            <h2 className="text-lg font-bold text-card-foreground">Contrato — {formData.cliente_nombre}</h2>
            <p className="text-xs text-muted-foreground mt-1">v{p.version}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Printer className="h-4 w-4" /> Imprimir/PDF
            </button>
            <button
              onClick={() => setEditMode(!editMode)}
              className={cn(
                "px-3 py-2 text-sm font-medium rounded-md transition-colors",
                editMode
                  ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              )}
            >
              {editMode ? "Listo" : "Editar"}
            </button>
            <button onClick={onClose} className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Contenido imprimible */}
        <div className="flex-1 overflow-y-auto px-6 py-8">
          <div className="max-w-3xl mx-auto space-y-6 print:space-y-4">
            {/* Encabezado */}
            <div className="text-center border-b-2 border-border pb-4">
              <h1 className="text-2xl font-bold text-card-foreground">CONTRATO DE SERVICIOS</h1>
              <p className="text-sm text-muted-foreground mt-2">La Carolina - Salón de Eventos</p>
            </div>

            {/* Datos del Cliente */}
            <section className="space-y-3">
              <h3 className="text-sm font-bold uppercase text-card-foreground border-b border-border pb-2">Datos del Cliente</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={editMode ? "text-xs font-semibold text-muted-foreground" : "text-xs text-muted-foreground"}>
                    Nombre Completo
                  </label>
                  {editMode ? (
                    <input
                      type="text"
                      name="cliente_nombre"
                      value={formData.cliente_nombre}
                      onChange={handleChange}
                      className="w-full border-b border-gray-300 bg-transparent py-1 text-sm font-medium"
                    />
                  ) : (
                    <p className="text-sm font-medium">{formData.cliente_nombre}</p>
                  )}
                </div>
                <div>
                  <label className={editMode ? "text-xs font-semibold text-muted-foreground" : "text-xs text-muted-foreground"}>
                    DNI
                  </label>
                  {editMode ? (
                    <input
                      type="text"
                      name="cliente_dni"
                      value={formData.cliente_dni}
                      onChange={handleChange}
                      className="w-full border-b border-gray-300 bg-transparent py-1 text-sm font-medium"
                    />
                  ) : (
                    <p className="text-sm font-medium">{formData.cliente_dni}</p>
                  )}
                </div>
                <div className="col-span-2">
                  <label className={editMode ? "text-xs font-semibold text-muted-foreground" : "text-xs text-muted-foreground"}>
                    Dirección
                  </label>
                  {editMode ? (
                    <input
                      type="text"
                      name="cliente_direccion"
                      value={formData.cliente_direccion}
                      onChange={handleChange}
                      className="w-full border-b border-gray-300 bg-transparent py-1 text-sm font-medium"
                    />
                  ) : (
                    <p className="text-sm font-medium">{formData.cliente_direccion}</p>
                  )}
                </div>
                <div>
                  <label className={editMode ? "text-xs font-semibold text-muted-foreground" : "text-xs text-muted-foreground"}>
                    Email
                  </label>
                  {editMode ? (
                    <input
                      type="email"
                      name="cliente_email"
                      value={formData.cliente_email}
                      onChange={handleChange}
                      className="w-full border-b border-gray-300 bg-transparent py-1 text-sm"
                    />
                  ) : (
                    <p className="text-sm">{formData.cliente_email}</p>
                  )}
                </div>
                <div>
                  <label className={editMode ? "text-xs font-semibold text-muted-foreground" : "text-xs text-muted-foreground"}>
                    Teléfono
                  </label>
                  {editMode ? (
                    <input
                      type="tel"
                      name="cliente_telefono"
                      value={formData.cliente_telefono}
                      onChange={handleChange}
                      className="w-full border-b border-gray-300 bg-transparent py-1 text-sm"
                    />
                  ) : (
                    <p className="text-sm">{formData.cliente_telefono}</p>
                  )}
                </div>
              </div>
            </section>

            {/* Datos del Evento */}
            <section className="space-y-3">
              <h3 className="text-sm font-bold uppercase text-card-foreground border-b border-border pb-2">Datos del Evento</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={editMode ? "text-xs font-semibold text-muted-foreground" : "text-xs text-muted-foreground"}>
                    Tipo de Evento
                  </label>
                  {editMode ? (
                    <input
                      type="text"
                      name="tipo_evento"
                      value={formData.tipo_evento}
                      onChange={handleChange}
                      className="w-full border-b border-gray-300 bg-transparent py-1 text-sm"
                    />
                  ) : (
                    <p className="text-sm">{formData.tipo_evento}</p>
                  )}
                </div>
                <div>
                  <label className={editMode ? "text-xs font-semibold text-muted-foreground" : "text-xs text-muted-foreground"}>
                    Cantidad de Invitados
                  </label>
                  {editMode ? (
                    <input
                      type="text"
                      name="invitados"
                      value={formData.invitados}
                      onChange={handleChange}
                      className="w-full border-b border-gray-300 bg-transparent py-1 text-sm"
                    />
                  ) : (
                    <p className="text-sm">{formData.invitados}</p>
                  )}
                </div>
                <div className="col-span-2">
                  <label className={editMode ? "text-xs font-semibold text-muted-foreground" : "text-xs text-muted-foreground"}>
                    Menú Seleccionado
                  </label>
                  {editMode ? (
                    <input
                      type="text"
                      name="menu"
                      value={formData.menu}
                      onChange={handleChange}
                      className="w-full border-b border-gray-300 bg-transparent py-1 text-sm"
                    />
                  ) : (
                    <p className="text-sm">{formData.menu}</p>
                  )}
                </div>
              </div>
            </section>

            {/* Valores de Tarjetas */}
            {(formData.minimo_tarjetas || formData.valor_adulto) && (
              <section className="space-y-3">
                <h3 className="text-sm font-bold uppercase text-card-foreground border-b border-border pb-2">Valores de Tarjetas</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className={editMode ? "text-xs font-semibold text-muted-foreground" : "text-xs text-muted-foreground"}>
                      Mínimo
                    </label>
                    {editMode ? (
                      <input
                        type="text"
                        name="minimo_tarjetas"
                        value={formData.minimo_tarjetas}
                        onChange={handleChange}
                        className="w-full border-b border-gray-300 bg-transparent py-1 text-sm"
                      />
                    ) : (
                      <p className="text-sm">{formData.minimo_tarjetas}</p>
                    )}
                  </div>
                  <div>
                    <label className={editMode ? "text-xs font-semibold text-muted-foreground" : "text-xs text-muted-foreground"}>
                      Adulto
                    </label>
                    {editMode ? (
                      <input
                        type="text"
                        name="valor_adulto"
                        value={formData.valor_adulto}
                        onChange={handleChange}
                        className="w-full border-b border-gray-300 bg-transparent py-1 text-sm"
                      />
                    ) : (
                      <p className="text-sm">{formData.valor_adulto}</p>
                    )}
                  </div>
                  <div>
                    <label className={editMode ? "text-xs font-semibold text-muted-foreground" : "text-xs text-muted-foreground"}>
                      Adolescente
                    </label>
                    {editMode ? (
                      <input
                        type="text"
                        name="valor_adolescente"
                        value={formData.valor_adolescente}
                        onChange={handleChange}
                        className="w-full border-b border-gray-300 bg-transparent py-1 text-sm"
                      />
                    ) : (
                      <p className="text-sm">{formData.valor_adolescente}</p>
                    )}
                  </div>
                  <div className="col-span-3">
                    <label className={editMode ? "text-xs font-semibold text-muted-foreground" : "text-xs text-muted-foreground"}>
                      Niño
                    </label>
                    {editMode ? (
                      <input
                        type="text"
                        name="valor_nino"
                        value={formData.valor_nino}
                        onChange={handleChange}
                        className="w-full border-b border-gray-300 bg-transparent py-1 text-sm"
                      />
                    ) : (
                      <p className="text-sm">{formData.valor_nino}</p>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* Servicios */}
            {formData.servicios_base && (
              <section className="space-y-3">
                <h3 className="text-sm font-bold uppercase text-card-foreground border-b border-border pb-2">Servicios Base</h3>
                {editMode ? (
                  <textarea
                    name="servicios_base"
                    value={formData.servicios_base}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded p-2 text-sm bg-card"
                    rows="3"
                  />
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{formData.servicios_base}</p>
                )}
              </section>
            )}

            {/* Adicionales */}
            {formData.adicionales_texto && (
              <section className="space-y-3">
                <h3 className="text-sm font-bold uppercase text-card-foreground border-b border-border pb-2">Adicionales Seleccionados</h3>
                {editMode ? (
                  <textarea
                    name="adicionales_texto"
                    value={formData.adicionales_texto}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded p-2 text-sm bg-card"
                    rows="4"
                  />
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{formData.adicionales_texto}</p>
                )}
              </section>
            )}

            {/* Datos Financieros */}
            <section className="space-y-3 border-t-2 border-border pt-4">
              <h3 className="text-sm font-bold uppercase text-card-foreground">Datos Financieros</h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-secondary/20 p-4 rounded">
                  <p className="text-xs text-muted-foreground">Valor de Seña</p>
                  {editMode ? (
                    <input
                      type="text"
                      name="valor_seña"
                      value={formData.valor_seña}
                      onChange={handleChange}
                      className="w-full border-b-2 border-primary bg-transparent py-2 text-xl font-bold text-card-foreground"
                    />
                  ) : (
                    <p className="text-xl font-bold text-primary">{formData.valor_seña}</p>
                  )}
                </div>
                <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded">
                  <p className="text-xs text-muted-foreground">Valor Total del Evento</p>
                  {editMode ? (
                    <input
                      type="text"
                      name="valor_total"
                      value={formData.valor_total}
                      onChange={handleChange}
                      className="w-full border-b-2 border-green-600 bg-transparent py-2 text-xl font-bold text-green-700 dark:text-green-400"
                    />
                  ) : (
                    <p className="text-xl font-bold text-green-700 dark:text-green-400">{formData.valor_total}</p>
                  )}
                </div>
              </div>
            </section>

            {/* Notas y Condiciones */}
            {formData.notas && (
              <section className="space-y-3 border-t-2 border-border pt-4">
                <h3 className="text-sm font-bold uppercase text-card-foreground">Condiciones y Notas</h3>
                {editMode ? (
                  <textarea
                    name="notas"
                    value={formData.notas}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded p-3 text-sm bg-card"
                    rows="6"
                  />
                ) : (
                  <p className="text-sm whitespace-pre-wrap text-card-foreground">{formData.notas}</p>
                )}
              </section>
            )}

            {/* Firma */}
            <section className="mt-12 pt-8 border-t-2 border-border space-y-8 print:mt-6 print:pt-4">
              <div className="grid grid-cols-2 gap-12">
                <div>
                  <p className="text-xs text-muted-foreground mb-12">_______________________</p>
                  <p className="text-xs font-semibold">Firma del Cliente</p>
                  {editMode ? (
                    <input
                      type="text"
                      placeholder="Nombre del cliente"
                      className="w-full border-b border-gray-300 bg-transparent py-1 text-xs mt-1"
                    />
                  ) : (
                    <p className="text-xs mt-1">___________________________</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-12">_______________________</p>
                  <p className="text-xs font-semibold">Firma de La Carolina</p>
                  <p className="text-xs mt-4">Autorizado por: ___________</p>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground text-center italic">
                Documento generado automáticamente por CarolinaOS - {new Date().toLocaleDateString("es-AR")}
              </p>
            </section>
          </div>
        </div>
      </div>

      {/* Estilos de impresión */}
      <style jsx>{`
        @media print {
          .fixed {
            position: static;
            z-index: 1;
          }
          body {
            background: white;
          }
          button {
            display: none;
          }
          .border-b {
            border-color: #000;
          }
          input,
          textarea {
            border: none !important;
            background: transparent !important;
          }
        }
      `}</style>
    </div>
  )
}
