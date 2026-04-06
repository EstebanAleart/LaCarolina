"use client"

import { useState } from "react"
import { X, Printer } from "lucide-react"
import { cn } from "@/lib/utils"

function fmt(n) {
  if (!n && n !== 0) return ""
  return Number(n).toLocaleString("es-AR", { maximumFractionDigits: 0 })
}

function fmtFecha(f) {
  if (!f) return ""
  const d = new Date(f.toString().substring(0, 10) + "T12:00:00")
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })
}

function Campo({ editMode, name, value, onChange, placeholder = "……………………………", className = "", type = "text", multiline = false }) {
  const base = "bg-transparent focus:outline-none"
  if (editMode) {
    if (multiline) {
      return (
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={2}
          className={cn(base, "border-b border-gray-400 w-full resize-none text-[11pt] leading-snug py-0.5", className)}
        />
      )
    }
    return (
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={cn(base, "border-b border-gray-400 text-[11pt] py-0.5 min-w-[60px]", className)}
      />
    )
  }
  return (
    <span className={cn("text-[11pt]", className)}>
      {value || <span className="text-gray-400">……………………</span>}
    </span>
  )
}

export function PrintableContract({ proposal: p, lead, onClose }) {
  const leadData = lead || p.lead || {}
  const fechaEvento = leadData.fecha_tentativa ? fmtFecha(leadData.fecha_tentativa) : ""

  const adicionalesArr = (() => {
    const raw = p.adicionales
    if (!raw) return []
    if (Array.isArray(raw)) return raw
    try { return JSON.parse(raw) } catch { return [] }
  })()

  const [editMode, setEditMode] = useState(true)
  const [f, setF] = useState({
    fecha_contrato:     new Date().toLocaleDateString("es-AR"),
    cliente_nombre:     leadData.nombre || "",
    cliente_dni:        p.dni || "",
    cliente_domicilio:  p.direccion || "",
    fecha_evento:       fechaEvento,
    tipo_evento:        p.tipo_evento || leadData.tipo_evento || "",
    valor_total:        p.valor_total_evento ? fmt(p.valor_total_evento) : "",
    valor_senia:        p.precio_senia ? fmt(p.precio_senia) : "",
    menu_1:             false,
    menu_2:             false,
    recepcion:          "",
    plato_principal:    "",
    postre:             "",
    trasnoche:          "",
    desayuno:           "",
    bebidas:            "",
    barra:              "",
    valor_adulto:       p.valor_tarjeta_adulto ? fmt(p.valor_tarjeta_adulto) : "",
    valor_adolescente:  p.valor_tarjeta_adolescente ? fmt(p.valor_tarjeta_adolescente) : "",
    valor_nino:         p.valor_tarjeta_nino ? fmt(p.valor_tarjeta_nino) : "",
    valor_vigente_hasta:"",
    ajuste_mensual:     true,
    ajuste_bimestral:   false,
    ajuste_trimestral:  false,
    minimo_tarjetas:    p.minimo_tarjetas ? String(p.minimo_tarjetas) : "80",
    adicionales_texto:  adicionalesArr.map(a => {
      const elegida = Array.isArray(a.opciones) ? a.opciones.find((_, i) => i === a.opcion_elegida) : null
      return `${a.nombre}: ${elegida?.descripcion || "Sin seleccionar"}${elegida?.precio ? ` ($${fmt(elegida.precio)})` : ""}`
    }).join("\n"),
    notas: p.contenido_html || "",
  })

  function handleChange(e) {
    const { name, value, type: t, checked } = e.target
    setF(prev => ({ ...prev, [name]: t === "checkbox" ? checked : value }))
  }

  function handlePrint() {
    const dot = (v) => v || "………………………………………………"
    const check = (v) => v ? "☑" : "☐"
    const linea = (txt) => txt
      ? txt.split("\n").map(l => `<p style="margin:0 0 2pt 0">• ${l}</p>`).join("")
      : `<p style="margin:0;color:#aaa">• ………………………………………………………………………………</p>`

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8"/>
<title>Contrato — ${f.cliente_nombre || "Carolina Eventos"}</title>
<style>
  @page { size: A4; margin: 18mm 20mm 20mm 20mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.45; color: #000; }
  h1 { font-size: 12.5pt; font-weight: bold; text-align: center; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 14pt; }
  p { margin-bottom: 6pt; text-align: justify; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1.5px solid #888; padding-bottom: 9pt; margin-bottom: 12pt; }
  .header-left { font-size: 8pt; line-height: 1.7; color: #444; }
  .header-right { text-align: right; }
  .brand-name { font-weight: bold; font-size: 13pt; letter-spacing: 0.5px; }
  .brand-sub { font-size: 8pt; letter-spacing: 3px; color: #666; }
  .seccion { font-weight: bold; text-align: center; text-transform: uppercase; margin: 10pt 0 8pt; font-size: 11pt; }
  .indented { padding-left: 16pt; }
  .sub-indented { padding-left: 10pt; }
  ol.decimal { padding-left: 22pt; list-style-type: decimal; }
  ol.decimal li { margin-bottom: 4pt; text-align: justify; }
  .anexo { border-top: 1.5px solid #888; padding-top: 10pt; margin-top: 10pt; }
  .menu-row { display: flex; gap: 24pt; padding-left: 8pt; margin-bottom: 8pt; }
  .check-box { display: inline-block; width: 13px; height: 13px; border: 1px solid #444; text-align: center; line-height: 12px; font-size: 9pt; margin-right: 4pt; }
  .menu-section { margin-bottom: 8pt; }
  .menu-label { font-weight: 600; font-size: 10pt; text-transform: uppercase; margin-bottom: 3pt; }
  .line-blank { border-bottom: 1px solid #bbb; min-height: 18pt; padding-bottom: 2pt; margin-bottom: 2pt; font-size: 11pt; color: #888; }
  .tarjetas { margin-bottom: 8pt; }
  .tarjetas p { margin-bottom: 4pt; }
  .firmas { display: grid; grid-template-columns: 1fr 1fr; gap: 60pt; margin-top: 40pt; }
  .firma-box { text-align: center; }
  .firma-line { border-top: 1px solid #000; padding-top: 6pt; }
  .firma-line p { text-align: center; margin-bottom: 2pt; }
  .firma-title { font-weight: 600; font-size: 10pt; }
  .firma-detail { font-size: 9.5pt; color: #444; }
  .notas-finales { margin-top: 20pt; }
  .notas-finales .label { font-weight: 600; margin-bottom: 6pt; }
  .nota-linea { border-bottom: 1px solid #bbb; height: 20pt; margin-bottom: 4pt; }
  .footer { font-size: 7.5pt; color: #999; text-align: center; font-style: italic; margin-top: 16pt; }
  .cac-row { display: flex; gap: 20pt; padding-left: 8pt; margin-bottom: 8pt; }
</style>
</head>
<body>

<div class="header">
  <div class="header-left">
    Ruta A012 . Kilómetro 7, S2105 La Carolina, Santa Fe.<br/>
    +54 9 3412 61-4718<br/>
    carolinaeventos.arg@gmail.com | carolinaeventos.comercial@gmail.com<br/>
    www.carolinaeventos.com.ar
  </div>
  <div class="header-right">
    <div class="brand-name">CAROLINA</div>
    <div class="brand-sub">EVENTOS</div>
  </div>
</div>

<h1>CONTRATO SERVICIO: TONUCOS CATERING</h1>

<p>
  Conste por el presente documento que el dia <strong>${dot(f.fecha_contrato)}</strong>,
  celebran contrato de una parte, identificada con DNI N°36.055.780, Nombre y apellido completo
  <strong>TONONI JUAN MANUEL</strong> con domicilio en GUEMES 50 de la localidad de PIÑERO a quien
  en lo sucesivo se denominará <strong>CATERING-SALON</strong>; y de otra parte, identificado con
  DNI N° <strong>${dot(f.cliente_dni)}</strong> Nombre y apellido completo
  <strong>${dot(f.cliente_nombre)}</strong> con domicilio <strong>${dot(f.cliente_domicilio)}</strong>
  a quien en lo sucesivo se denominara <strong>LA CLIENTA</strong>; en los términos y condiciones siguientes:
</p>

<p><strong>1 -</strong> LA SOCIEDAD DE CATERING-SALON es una persona jurídica, cuyo OBJETO SOCIAL es la prestación de servicios de ALQUILER DE SALON PARA EVENTOS Y SERVICIOS DE CATERING.</p>
<p><strong>2 -</strong> LA CLIENTA es una persona natural, interesada en contratar los servicios de la sociedad de CATERING-SALON a fin de que se encargue de las prestación de servicio AL CLIENTE.</p>

<p class="seccion">OBJETO DEL CONTRATO</p>

<p>
  <strong>3 -</strong> En virtud del presente contrato, CATERING-SALON ALQUILA, el día
  <strong>${dot(f.fecha_evento)}</strong>${f.tipo_evento ? ` para el evento de tipo <strong>${f.tipo_evento}</strong>` : ""}.
  Por tal servicio la clienta abonará la suma de PESOS <strong>${dot(f.valor_total)}</strong>
  en concepto de salón de eventos con nombre <strong>CAROLINA EVENTOS</strong>. Dirección RUTA A012. a KM 6.5.
  A PAGAR DE LA SIGUIENTE FORMA:
</p>
<div class="indented">
  <p><strong>a - RESERVA:</strong> La clienta seña con la suma de PESOS <strong>${dot(f.valor_senia)}</strong> (………………………………………………………………………………)</p>
  <p><strong>b - Nota:</strong> La cliente asume el compromiso de cancelar la totalidad del precio contratado en un plazo máximo de doce (12) meses contados a partir de la fecha de firma del presente contrato. Asimismo, el saldo total adeudado deberá encontrarse íntegramente abonado con una antelación máxima de treinta (30) días corridos previos a la fecha del evento. En caso de no haber completado el pago dentro de los plazos establecidos, el evento no será cancelado; no obstante, el saldo pendiente será actualizado al valor vigente de lista del salón al momento de su efectiva cancelación.</p>
</div>

<p><strong>4 -</strong> Detalles de menú en anexo a este documento</p>
<p><strong>5 -</strong> CATERING-SALÓN contará con los siguientes servicios:</p>
<ol class="decimal">
  <li>GRUPO ELECTROGENO</li><li>COBERTURA MÉDICA</li><li>SONIDO E ILUMINACION</li>
  <li>DJ SELECTOR</li><li>PANTALLA PARA REPRODUCCIÓN DE VIDEO</li><li>MESAS</li>
  <li>SILLAS</li><li>JUEGO DE LIVING INTERIOR</li><li>MANTELERÍA</li>
  <li>PERSONAL DE LIMPIEZA</li><li>CLIMATIZACIÓN</li>
</ol>
<br/>
<p><strong>6 -</strong> Realiza seña para fecha <strong>${dot(f.fecha_evento)}</strong></p>
<ol class="decimal">
  <li>En caso de no realizar dicho evento por motivos relacionados de la clienta no se devolverá el dinero de seña, pago salon y solo se reconoce el valor del 50% de lo pagado en tarjetas, también se deja aclarado que de ser necesario se podrá cambiar fecha original por otro a tal fin de poder realizar el evento.</li>
  <li>EN relación a suspensión del evento por parte de CATERING-SALON SE DEVOLVERÁ LA TOTALIDAD DEL DINERO RECIBIDO TANTO DE SALON COMO DE SERVICIO DE CATERING.</li>
</ol>
${f.adicionales_texto ? `<br/><p><strong>Adicionales contratados:</strong></p><div class="sub-indented">${linea(f.adicionales_texto)}</div>` : ""}
${f.notas ? `<br/><p><strong>Condiciones especiales / Notas:</strong></p><div class="sub-indented"><p style="white-space:pre-wrap">${f.notas}</p></div>` : ""}

<div class="anexo">
  <p><strong>7 - Anexo 1.</strong></p><br/>
  <div class="menu-row">
    <span><span class="check-box">${check(f.menu_1)}</span> Menú 1.</span>
    <span><span class="check-box">${check(f.menu_2)}</span> Menú 2.</span>
  </div>
  <p style="font-weight:600;margin-bottom:8pt">Detalles del menú:</p>
  ${[
    ["RECEPCION", f.recepcion],
    ["PLATO PRINCIPAL", f.plato_principal],
    ["POSTRE", f.postre],
    ["TRASNOCHE", f.trasnoche],
    ["DESAYUNO", f.desayuno],
    ["BEBIDAS", f.bebidas],
  ].map(([label, val]) => `
  <div class="menu-section">
    <p class="menu-label">${label}:</p>
    <div class="sub-indented line-blank">${val ? `• ${val}` : "• ………………………………………………………………………………………………"}</div>
  </div>`).join("")}
  <div class="menu-section">
    <p class="menu-label">BEBIDAS — Barra:</p>
    <div class="sub-indented line-blank">${f.barra ? `• Barra: ${f.barra}` : "• Barra:........................................................................"}</div>
  </div>

  <br/>
  <div class="tarjetas">
    <p style="font-weight:600;margin-bottom:6pt">Valor de tarjeta unitaria inicial:</p>
    <ol class="decimal">
      <li>Adultos: Pesos <strong>${dot(f.valor_adulto)}</strong></li>
      <li>Adolescentes: Pesos <strong>${dot(f.valor_adolescente)}</strong></li>
      <li>Niños de 3 a 10 años: <strong>${dot(f.valor_nino)}</strong></li>
    </ol>
  </div>

  <p>Valor vigente hasta la fecha: <strong>${dot(f.valor_vigente_hasta)}</strong></p>
  <br/>
  <p style="font-weight:600;margin-bottom:5pt">Actualización de precio: Ajuste por CAC</p>
  <div class="cac-row">
    <span><span class="check-box">${check(f.ajuste_mensual)}</span> Mensual</span>
    <span><span class="check-box">${check(f.ajuste_bimestral)}</span> Bimestral</span>
    <span><span class="check-box">${check(f.ajuste_trimestral)}</span> Trimestral</span>
  </div>
  <p>Mínimo de tarjetas: <strong>${f.minimo_tarjetas || "80"}</strong> ADULTOS.</p>

  <div class="firmas">
    <div class="firma-box">
      <div class="firma-line">
        <p class="firma-title">Firma de LA CLIENTA</p>
        <p class="firma-detail">${f.cliente_nombre || "……………………………………"}</p>
        <p class="firma-detail">DNI: ${f.cliente_dni || "…………………"}</p>
      </div>
    </div>
    <div class="firma-box">
      <div class="firma-line">
        <p class="firma-title">Firma de CATERING-SALON</p>
        <p class="firma-detail">TONONI JUAN MANUEL</p>
        <p class="firma-detail">DNI: 36.055.780</p>
      </div>
    </div>
  </div>

  <div class="notas-finales">
    <p class="label">Notas:</p>
    <div class="nota-linea"></div>
    <div class="nota-linea"></div>
    <div class="nota-linea"></div>
  </div>

  <p class="footer">Documento generado automáticamente por CarolinaOS · ${new Date().toLocaleDateString("es-AR")}</p>
</div>

</body>
</html>`

    const win = window.open("", "_blank")
    if (!win) { alert("Habilitá las ventanas emergentes para imprimir"); return }
    win.document.write(html)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print() }, 400)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      {/* Modal container */}
      <div className="relative w-full max-w-4xl max-h-[95vh] flex flex-col bg-white rounded shadow-2xl mx-4 print:shadow-none print:rounded-none print:max-w-none print:max-h-none print:fixed print:inset-0">

        {/* Toolbar — hidden on print */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-2.5 bg-gray-50 print:hidden shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-gray-800">Contrato — {f.cliente_nombre || "Sin nombre"}</h2>
            <p className="text-xs text-gray-500">v{p.version} · {p.estado}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded bg-gray-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-700 transition-colors"
            >
              <Printer className="h-3.5 w-3.5" /> Imprimir / PDF
            </button>
            <button
              onClick={() => setEditMode(!editMode)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded transition-colors",
                editMode ? "bg-amber-100 text-amber-800 hover:bg-amber-200" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {editMode ? "✓ Listo" : "Editar"}
            </button>
            <button onClick={onClose} className="rounded p-1 text-gray-500 hover:bg-gray-100">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Scrollable contract body */}
        <div className="flex-1 overflow-y-auto print:overflow-visible">
          {/* The printable page */}
          <div
            className="mx-auto bg-white print:m-0"
            style={{ maxWidth: "210mm", padding: "15mm 20mm 20mm 20mm", fontFamily: "Arial, sans-serif", fontSize: "11pt", lineHeight: "1.45", color: "#000" }}
          >

            {/* ── HEADER ── */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12pt", borderBottom: "1px solid #ccc", paddingBottom: "10pt" }}>
              {/* Left: contact info */}
              <div style={{ fontSize: "8pt", lineHeight: "1.6", color: "#444" }}>
                <div>Ruta A012 . Kilómetro 7, S2105 La Carolina, Santa Fe.</div>
                <div>+54 9 3412 61-4718</div>
                <div>carolinaeventos.arg@gmail.com | carolinaeventos.comercial@gmail.com</div>
                <div>www.carolinaeventos.com.ar</div>
              </div>
              {/* Right: logo area */}
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: "bold", fontSize: "13pt", letterSpacing: "0.5px", color: "#222" }}>CAROLINA</div>
                <div style={{ fontSize: "8pt", color: "#666", letterSpacing: "2px" }}>EVENTOS</div>
              </div>
            </div>

            {/* ── TITLE ── */}
            <div style={{ textAlign: "center", fontWeight: "bold", fontSize: "13pt", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "14pt" }}>
              CONTRATO SERVICIO: TONUCOS CATERING
            </div>

            {/* ── CUERPO ── */}
            <div style={{ textAlign: "justify" }}>

              {/* Párrafo intro */}
              <p style={{ marginBottom: "8pt" }}>
                Conste por el presente documento que el dia{" "}
                <Campo editMode={editMode} name="fecha_contrato" value={f.fecha_contrato} onChange={handleChange} className="w-36" />,
                celebran contrato de una parte, identificada con DNI N°36.055.780, Nombre y apellido completo{" "}
                <strong>TONONI JUAN MANUEL</strong> con domicilio en GUEMES 50 de la localidad de PIÑERO a quien en lo
                sucesivo se denominará <strong>CATERING-SALON</strong>; y de otra parte, identificado con DNI N°{" "}
                <Campo editMode={editMode} name="cliente_dni" value={f.cliente_dni} onChange={handleChange} placeholder="………" className="w-28" />
                {" "}Nombre y apellido completo{" "}
                <Campo editMode={editMode} name="cliente_nombre" value={f.cliente_nombre} onChange={handleChange} placeholder="……………………………" className="w-52" />
                {" "}con domicilio{" "}
                <Campo editMode={editMode} name="cliente_domicilio" value={f.cliente_domicilio} onChange={handleChange} placeholder="……………………………………" className="w-64" />
                {" "}a quien en lo sucesivo se denominara <strong>LA CLIENTA</strong>; en los términos y condiciones siguientes:
              </p>

              <p style={{ marginBottom: "6pt" }}>
                <strong>1 -</strong> LA SOCIEDAD DE CATERING-SALON es una persona jurídica, cuyo OBJETO SOCIAL es la prestación
                de servicios de ALQUILER DE SALON PARA EVENTOS Y SERVICIOS DE CATERING.
              </p>
              <p style={{ marginBottom: "6pt" }}>
                <strong>2 -</strong> LA CLIENTA es una persona natural, interesada en contratar los servicios de la sociedad de
                CATERING-SALON a fin de que se encargue de las prestación de servicio AL CLIENTE.
              </p>

              {/* Objeto */}
              <p style={{ textAlign: "center", fontWeight: "bold", textTransform: "uppercase", margin: "10pt 0 8pt" }}>
                OBJETO DEL CONTRATO
              </p>

              <p style={{ marginBottom: "8pt" }}>
                <strong>3 -</strong> En virtud del presente contrato, CATERING-SALON ALQUILA, el día{" "}
                <Campo editMode={editMode} name="fecha_evento" value={f.fecha_evento} onChange={handleChange} placeholder="…………………………" className="w-36" />
                {" "}para el evento de tipo{" "}
                <Campo editMode={editMode} name="tipo_evento" value={f.tipo_evento} onChange={handleChange} placeholder="…………………………" className="w-36" />.
                {" "}Por tal servicio la clienta abonará la suma de PESOS{" "}
                <Campo editMode={editMode} name="valor_total" value={f.valor_total} onChange={handleChange} placeholder="………………………" className="w-44" />
                {" "}en concepto de salón de eventos con nombre <strong>CAROLINA EVENTOS</strong>. Dirección RUTA A012. a KM 6.5.
                A PAGAR DE LA SIGUIENTE FORMA:
              </p>

              <div style={{ paddingLeft: "16pt", marginBottom: "8pt" }}>
                <p style={{ marginBottom: "5pt" }}>
                  <strong>a - RESERVA:</strong> La clienta seña con la suma de PESOS{" "}
                  <Campo editMode={editMode} name="valor_senia" value={f.valor_senia} onChange={handleChange} placeholder="………………………" className="w-40" />
                  {" "}(……………………………………………………………………………………)
                </p>
                <p style={{ marginBottom: "5pt" }}>
                  <strong>b - Nota:</strong> La cliente asume el compromiso de cancelar la totalidad del precio contratado en
                  un plazo máximo de doce (12) meses contados a partir de la fecha de firma del presente contrato. Asimismo,
                  el saldo total adeudado deberá encontrarse íntegramente abonado con una antelación máxima de treinta (30)
                  días corridos previos a la fecha del evento. En caso de no haber completado el pago dentro de los plazos
                  establecidos, el evento no será cancelado; no obstante, el saldo pendiente será actualizado al valor vigente
                  de lista del salón al momento de su efectiva cancelación.
                </p>
              </div>

              <p style={{ marginBottom: "5pt" }}><strong>4 -</strong> Detalles de menú en anexo a este documento</p>
              <p style={{ marginBottom: "5pt" }}><strong>5 -</strong> CATERING-SALÓN contará con los siguientes servicios:</p>

              <ol style={{ paddingLeft: "24pt", marginBottom: "8pt", listStyleType: "decimal" }}>
                {["GRUPO ELECTROGENO","COBERTURA MÉDICA","SONIDO E ILUMINACION","DJ SELECTOR","PANTALLA PARA REPRODUCCIÓN DE VIDEO","MESAS","SILLAS","JUEGO DE LIVING INTERIOR","MANTELERÍA","PERSONAL DE LIMPIEZA","CLIMATIZACIÓN"].map(s => (
                  <li key={s} style={{ marginBottom: "2pt" }}>{s}</li>
                ))}
              </ol>

              <p style={{ marginBottom: "5pt" }}>
                <strong>6 -</strong> Realiza seña para fecha{" "}
                <Campo editMode={editMode} name="fecha_evento" value={f.fecha_evento} onChange={handleChange} placeholder="……………………………" className="w-40" />
              </p>

              <ol style={{ paddingLeft: "24pt", marginBottom: "10pt", listStyleType: "decimal" }}>
                <li style={{ marginBottom: "5pt" }}>
                  En caso de no realizar dicho evento por motivos relacionados de la clienta no se devolverá el dinero de seña,
                  pago salon y solo se reconoce el valor del 50% de lo pagado en tarjetas, también se deja aclarado que de ser
                  necesario se podrá cambiar fecha original por otro a tal fin de poder realizar el evento.
                </li>
                <li style={{ marginBottom: "5pt" }}>
                  EN relación a suspensión del evento por parte de CATERING-SALON SE DEVOLVERÁ LA TOTALIDAD DEL DINERO RECIBIDO
                  TANTO DE SALON COMO DE SERVICIO DE CATERING.
                </li>
              </ol>

              {/* Adicionales */}
              {(f.adicionales_texto || editMode) && (
                <div style={{ marginBottom: "8pt" }}>
                  <p style={{ fontWeight: "600", marginBottom: "3pt" }}>Adicionales contratados:</p>
                  {editMode ? (
                    <textarea
                      name="adicionales_texto"
                      value={f.adicionales_texto}
                      onChange={handleChange}
                      rows={Math.max(2, (f.adicionales_texto?.split("\n").length || 0) + 1)}
                      placeholder="Adicionales contratados..."
                      className="w-full border border-gray-300 rounded p-2 text-sm bg-white focus:outline-none focus:border-gray-500"
                    />
                  ) : (
                    f.adicionales_texto && <pre style={{ whiteSpace: "pre-wrap", fontSize: "11pt", paddingLeft: "12pt" }}>{f.adicionales_texto}</pre>
                  )}
                </div>
              )}

              {/* Notas */}
              {(f.notas || editMode) && (
                <div style={{ marginBottom: "10pt" }}>
                  <p style={{ fontWeight: "600", marginBottom: "3pt" }}>Condiciones especiales / Notas:</p>
                  {editMode ? (
                    <textarea
                      name="notas"
                      value={f.notas}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Condiciones especiales..."
                      className="w-full border border-gray-300 rounded p-2 text-sm bg-white focus:outline-none focus:border-gray-500"
                    />
                  ) : (
                    f.notas && <p style={{ whiteSpace: "pre-wrap", paddingLeft: "12pt", fontSize: "11pt" }}>{f.notas}</p>
                  )}
                </div>
              )}

              {/* ── ANEXO 1 ── */}
              <div style={{ borderTop: "1.5px solid #999", paddingTop: "10pt", marginTop: "6pt" }}>
                <p style={{ fontWeight: "bold", marginBottom: "8pt" }}><strong>7 - Anexo 1.</strong></p>

                {/* Selección menú */}
                <div style={{ display: "flex", gap: "20pt", paddingLeft: "8pt", marginBottom: "8pt" }}>
                  {[["menu_1","Menú 1."],["menu_2","Menú 2."]].map(([nm, label]) => (
                    <label key={nm} style={{ display: "flex", alignItems: "center", gap: "5pt", cursor: "pointer", fontSize: "11pt" }}>
                      {editMode ? (
                        <input type="checkbox" name={nm} checked={f[nm]} onChange={handleChange} />
                      ) : (
                        <span style={{ display:"inline-block", width:"13px", height:"13px", border:"1px solid #555", textAlign:"center", lineHeight:"13px", fontSize:"9pt" }}>
                          {f[nm] ? "✓" : ""}
                        </span>
                      )}
                      {label}
                    </label>
                  ))}
                </div>

                <p style={{ fontWeight: "600", marginBottom: "6pt" }}>Detalles del menú:</p>

                {[
                  { label: "RECEPCION", name: "recepcion" },
                  { label: "PLATO PRINCIPAL", name: "plato_principal" },
                  { label: "POSTRE", name: "postre" },
                  { label: "TRASNOCHE", name: "trasnoche" },
                  { label: "DESAYUNO", name: "desayuno" },
                  { label: "BEBIDAS", name: "bebidas" },
                ].map(({ label, name }) => (
                  <div key={name} style={{ marginBottom: "6pt" }}>
                    <p style={{ fontWeight: "600", fontSize: "10pt", textTransform: "uppercase", marginBottom: "2pt" }}>{label}:</p>
                    <div style={{ paddingLeft: "10pt" }}>
                      {editMode ? (
                        <textarea
                          name={name}
                          value={f[name]}
                          onChange={handleChange}
                          rows={2}
                          placeholder="●  ……………………………………………………………………………"
                          className="w-full border-b border-gray-400 bg-transparent text-[11pt] focus:outline-none resize-none py-0.5"
                        />
                      ) : (
                        <p style={{ fontSize: "11pt", borderBottom: "1px solid #aaa", minHeight: "20pt", paddingBottom: "2pt" }}>
                          {f[name] ? `● ${f[name]}` : <span style={{ color: "#aaa" }}>● ………………………………………………………………………………………………</span>}
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                {/* Barra */}
                <div style={{ marginBottom: "10pt" }}>
                  <p style={{ fontWeight: "600", fontSize: "10pt", textTransform: "uppercase", marginBottom: "2pt" }}>BEBIDAS — Barra:</p>
                  <div style={{ paddingLeft: "10pt" }}>
                    {editMode ? (
                      <textarea
                        name="barra"
                        value={f.barra}
                        onChange={handleChange}
                        rows={2}
                        placeholder="●  Barra:........................................................................"
                        className="w-full border-b border-gray-400 bg-transparent text-[11pt] focus:outline-none resize-none py-0.5"
                      />
                    ) : (
                      <p style={{ fontSize: "11pt", borderBottom: "1px solid #aaa", minHeight: "20pt", paddingBottom: "2pt" }}>
                        {f.barra ? `● Barra: ${f.barra}` : <span style={{ color: "#aaa" }}>● Barra:........................................................................</span>}
                      </p>
                    )}
                  </div>
                </div>

                {/* Tarjetas */}
                <div style={{ marginBottom: "8pt" }}>
                  <p style={{ fontWeight: "600", marginBottom: "5pt" }}>Valor de tarjeta unitaria inicial:</p>
                  <ol style={{ paddingLeft: "24pt", listStyleType: "decimal" }}>
                    <li style={{ marginBottom: "4pt" }}>
                      Adultos: Pesos{" "}
                      <Campo editMode={editMode} name="valor_adulto" value={f.valor_adulto} onChange={handleChange} placeholder="…………………………………………" className="w-52" />
                    </li>
                    <li style={{ marginBottom: "4pt" }}>
                      Adolescentes: Pesos{" "}
                      <Campo editMode={editMode} name="valor_adolescente" value={f.valor_adolescente} onChange={handleChange} placeholder="…………………………………" className="w-52" />
                    </li>
                    <li style={{ marginBottom: "4pt" }}>
                      Niños de 3 a 10 años:{" "}
                      <Campo editMode={editMode} name="valor_nino" value={f.valor_nino} onChange={handleChange} placeholder="………………………………………………" className="w-52" />
                    </li>
                  </ol>
                </div>

                <p style={{ marginBottom: "8pt" }}>
                  Valor vigente hasta la fecha:{" "}
                  <Campo editMode={editMode} name="valor_vigente_hasta" value={f.valor_vigente_hasta} onChange={handleChange} placeholder="………………………………………………" className="w-52" />
                </p>

                <p style={{ fontWeight: "600", marginBottom: "5pt" }}>Actualización de precio: Ajuste por CAC</p>
                <div style={{ display: "flex", gap: "20pt", paddingLeft: "8pt", marginBottom: "8pt" }}>
                  {[
                    ["ajuste_mensual","Mensual"],
                    ["ajuste_bimestral","Bimestral"],
                    ["ajuste_trimestral","Trimestral"],
                  ].map(([nm, label]) => (
                    <label key={nm} style={{ display:"flex", alignItems:"center", gap:"5pt", cursor:"pointer", fontSize:"11pt" }}>
                      {editMode ? (
                        <input type="checkbox" name={nm} checked={f[nm]} onChange={handleChange} />
                      ) : (
                        <span style={{ display:"inline-block", width:"13px", height:"13px", border:"1px solid #555", textAlign:"center", lineHeight:"13px", fontSize:"9pt" }}>
                          {f[nm] ? "✓" : ""}
                        </span>
                      )}
                      {label}
                    </label>
                  ))}
                </div>

                <p style={{ marginBottom: "14pt" }}>
                  Mínimo de tarjetas:{" "}
                  <Campo editMode={editMode} name="minimo_tarjetas" value={f.minimo_tarjetas} onChange={handleChange} placeholder="…" className="w-16" />
                  {" "}ADULTOS.
                </p>

                {/* Firmas */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "60pt", marginTop: "40pt" }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ borderTop: "1px solid #000", paddingTop: "6pt" }}>
                      <p style={{ fontSize: "10pt", fontWeight: "600" }}>Firma de LA CLIENTA</p>
                      <p style={{ fontSize: "9.5pt", color: "#444" }}>{f.cliente_nombre || "……………………………………"}</p>
                      <p style={{ fontSize: "9.5pt", color: "#444" }}>DNI: {f.cliente_dni || "…………………"}</p>
                    </div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ borderTop: "1px solid #000", paddingTop: "6pt" }}>
                      <p style={{ fontSize: "10pt", fontWeight: "600" }}>Firma de CATERING-SALON</p>
                      <p style={{ fontSize: "9.5pt", color: "#444" }}>TONONI JUAN MANUEL</p>
                      <p style={{ fontSize: "9.5pt", color: "#444" }}>DNI: 36.055.780</p>
                    </div>
                  </div>
                </div>

                {/* Notas finales */}
                <div style={{ marginTop: "20pt" }}>
                  <p style={{ fontWeight: "600", marginBottom: "4pt" }}>Notas:</p>
                  <div style={{ borderBottom: "1px solid #aaa", minHeight: "18pt", marginBottom: "4pt" }} />
                  <div style={{ borderBottom: "1px solid #aaa", minHeight: "18pt", marginBottom: "4pt" }} />
                  <div style={{ borderBottom: "1px solid #aaa", minHeight: "18pt" }} />
                </div>

                <p style={{ fontSize: "8pt", color: "#888", textAlign: "center", fontStyle: "italic", marginTop: "16pt" }}>
                  Documento generado automáticamente por CarolinaOS · {new Date().toLocaleDateString("es-AR")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print styles */}
      
    </div>
  )
}