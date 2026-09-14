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
    cliente_telefono:   leadData.telefono || "",
    cliente_email:      leadData.email || "",
    fecha_evento:       fechaEvento,
    tipo_evento:        p.tipo_evento || leadData.tipo_evento || "",
    valor_total:        p.valor_total_evento ? fmt(p.valor_total_evento) : "",
    valor_senia:        p.precio_senia ? fmt(p.precio_senia) : "",
    cantidad_minima:    p.minimo_tarjetas ? String(p.minimo_tarjetas) : (p.invitados_estimados ? String(p.invitados_estimados) : (leadData.invitados_estimados ? String(leadData.invitados_estimados) : "")),
    monto_minimo:       "",
    combo_cotillon:     "N.º 1",
    menu_1:             false,
    menu_2:             false,
    valor_adulto:       p.valor_tarjeta_adulto ? fmt(p.valor_tarjeta_adulto) : "",
    valor_adolescente:  p.valor_tarjeta_adolescente ? fmt(p.valor_tarjeta_adolescente) : "",
    valor_nino:         p.valor_tarjeta_nino ? fmt(p.valor_tarjeta_nino) : "",
    valor_vigente_hasta:"",
    ajuste_mensual:     false,
    ajuste_bimestral:   true,
    ajuste_trimestral:  false,
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
    const origin = typeof window !== "undefined" ? window.location.origin : ""
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
  body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.7; color: #000; position: relative; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  strong { font-weight: normal; }
  table.doc { width: 100%; border-collapse: collapse; position: relative; z-index: 1; }
  table.doc thead { display: table-header-group; }
  table.doc td { padding: 0; vertical-align: top; }
  .watermark { position: fixed; top: 90mm; left: 50%; transform: translateX(-50%); width: 100%; opacity: 0.05; z-index: -1; }
  h1 { font-size: 13pt; font-weight: normal; text-align: center; text-decoration: underline; margin: 6pt 0 18pt; }
  p { margin-bottom: 9pt; text-align: justify; }
  .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1.5px solid #888; padding-bottom: 9pt; margin-bottom: 12pt; }
  .header-left { font-size: 8pt; line-height: 1.7; color: #444; }
  .header-right { display: flex; align-items: center; gap: 14pt; }
  .header-right img.logo-ce { width: 150px; height: auto; }
  .header-right img.logo-tc { width: 110px; height: auto; }
  .seccion { font-weight: normal; text-align: left; margin: 12pt 0 9pt; font-size: 11pt; }
  .indented { padding-left: 16pt; }
  .sub-indented { padding-left: 10pt; }
  ol.decimal { padding-left: 22pt; list-style-type: decimal; }
  ol.upper-latin { padding-left: 22pt; list-style-type: upper-latin; }
  ol li { margin-bottom: 4pt; text-align: justify; }
  .anexo { border-top: 1.5px solid #888; padding-top: 10pt; margin-top: 10pt; }
  .menu-row { display: flex; gap: 24pt; padding-left: 8pt; margin-bottom: 8pt; }
  .check-box { display: inline-block; width: 13px; height: 13px; border: 1px solid #444; text-align: center; line-height: 12px; font-size: 9pt; margin-right: 4pt; }
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

<img class="watermark" src="${origin}/images/LOGO%20PIE1.1%20mail.png" alt="" />

<table class="doc">
<thead>
<tr><td>
<div class="header">
  <div class="header-left">
    Ruta A012 . Kilómetro 7, S2105 La Carolina, Santa Fe.<br/>
    +54 9 3412 61-4718<br/>
    carolinaeventos.arg@gmail.com | carolinaeventos.comercial@gmail.com<br/>
    www.carolinaeventos.com.ar
  </div>
  <div class="header-right">
    <img class="logo-ce" src="${origin}/images/LOGO%20PIE1.1%20mail.png" alt="Carolina Eventos" />
    <img class="logo-tc" src="${origin}/images/tonucos-catering.jpeg" alt="Tonucos Catering" />
  </div>
</div>
</td></tr>
</thead>
<tbody>
<tr><td>

<h1>CONTRATO SERVICIO: TONUCOS CATERING</h1>

<p>
  Conste por el presente documento que el dia <strong>${dot(f.fecha_contrato)}</strong>,
  celebran contrato de una parte, identificada con DNI N°36.055.780, Nombre y apellido completo
  <strong>TONONI JUAN MANUEL</strong> con domicilio en GUEMES 50 de la localidad de PIÑERO a quien
  en lo sucesivo se denominará <strong>CATERING-SALÓN</strong>; y de otra parte, identificado con
  DNI N° <strong>${dot(f.cliente_dni)}</strong>, Nombre y apellido completo
  <strong>${dot(f.cliente_nombre)}</strong> con domicilio en <strong>${dot(f.cliente_domicilio)}</strong>,
  N° teléfono <strong>${dot(f.cliente_telefono)}</strong>, e-mail <strong>${dot(f.cliente_email)}</strong>
  a quien en lo sucesivo se denominará <strong>LA CLIENTA</strong>; en los términos y condiciones siguientes:
</p>

<p><strong>1 -</strong> LA SOCIEDAD DE CATERING-SALÓN es una persona jurídica, cuyo OBJETO SOCIAL es la prestación de servicios de ALQUILER DE SALÓN PARA EVENTOS Y SERVICIOS DE CATERING.</p>
<p><strong>2 -</strong> LA CLIENTA es una persona natural, interesada en contratar los servicios ofrecidos por CATERING-SALÓN para la realización del evento detallado en el presente contrato.</p>

<p class="seccion">OBJETO DEL CONTRATO</p>

<p>
  <strong>3 -</strong> CATERING-SALÓN alquila a LA CLIENTA el salón de eventos denominado <strong>CAROLINA EVENTOS</strong>,
  ubicado en Ruta A012, Km 6,5, para la realización del evento previsto para el día
  <strong>${dot(f.fecha_evento)}</strong>${f.tipo_evento ? ` (evento de tipo <strong>${f.tipo_evento}</strong>)` : ""}.
  Por la contratación del referido servicio, LA CLIENTA abonará la suma de PESOS <strong>$${dot(f.valor_total)}</strong>,
  en concepto de alquiler del salón.
</p>
<p style="margin-top:6pt">A PAGAR DE LA SIGUIENTE FORMA:</p>
<div class="indented">
  <p><strong>a - RESERVA:</strong> La clienta seña con la suma de PESOS <strong>$${dot(f.valor_senia)}</strong> (………………………………………………………)</p>
  <p><strong>b - CANTIDAD MÍNIMA GARANTIZADA:</strong> El presente servicio se contrata con una cantidad mínima garantizada de <strong>${dot(f.cantidad_minima)}</strong> personas. En caso de que la asistencia final resulte inferior a dicha cantidad, el contratante se compromete a abonar la suma de <strong>$${dot(f.monto_minimo)}</strong> (……………………………………………), equivalente al valor mínimo pactado para el evento.</p>
  <p><strong>c - NOTA:</strong> La cliente asume el compromiso de cancelar la totalidad del precio correspondiente al alquiler del salón en un plazo máximo de doce (12) meses contados a partir de la fecha de firma del presente contrato.</p>
</div>
<p class="indented">Asimismo, el saldo total adeudado deberá encontrarse íntegramente abonado con una antelación mínima de treinta (30) días corridos previos a la fecha del evento. Si la contratación se realiza con menos de doce (12) meses de anticipación a la fecha del evento, la totalidad del importe deberá encontrarse cancelada, como máximo, veinte (20) días corridos antes de la celebración del evento.</p>
<p class="indented">En caso de no haberse completado el pago dentro de los plazos establecidos, el evento no será cancelado; sin embargo, el saldo pendiente será actualizado conforme al valor de lista vigente del alquiler del salón al momento de su efectiva cancelación, debiendo la cliente abonar la diferencia resultante antes de la realización del evento.</p>
<p class="indented">No obstante, si a siete (7) días corridos de la fecha prevista para el evento persistiera deuda pendiente correspondiente al alquiler del salón, el prestador podrá resolver el presente contrato y dejar sin efecto la reserva, perdiendo la cliente las sumas abonadas hasta ese momento en concepto de seña o pagos a cuenta, sin que corresponda devolución de las sumas abonadas ni indemnización alguna a favor de la cliente.</p>

<p><strong>4 -</strong> CATERING-SALÓN contará con los siguientes servicios:</p>
<ol class="upper-latin">
  <li>GRUPO ELECTROGENO</li><li>COBERTURA MÉDICA</li><li>SONIDO E ILUMINACION</li>
  <li>DJ</li><li>PANTALLA PARA REPRODUCCIÓN DE VIDEO</li><li>MESAS</li>
  <li>SILLAS</li><li>JUEGO DE LIVING INTERIOR</li><li>MANTELERÍA</li>
  <li>PERSONAL DE LIMPIEZA</li><li>CLIMATIZACIÓN</li><li>COTILLÓN</li>
</ol>
<p><strong>NOTA PUNTO L:</strong> El presente servicio incluye, sin costo adicional, el Combo N.º 1 de cotillón, conforme a la descripción y características vigentes establecidas por CAROLINA EVENTOS al momento de la celebración del evento.</p>
<p>En caso de que LA CLIENTA desee contratar una opción superior, podrá optar por el Combo N.º 2 o el Combo N.º 3, abonando la diferencia económica correspondiente respecto del Combo N.º 1. Dicha elección deberá quedar expresamente consignada en el presente contrato o en un anexo complementario firmado por ambas partes.</p>
<p>Los valores de actualización y diferencias entre combos serán informados por CAROLINA EVENTOS y deberán encontrarse cancelados junto con el saldo total del evento, respetando los plazos de pago establecidos en el presente contrato.</p>
<p class="indented"><strong>Combo de cotillón seleccionado:</strong> <strong>${dot(f.combo_cotillon)}</strong></p>

<p><strong>5 -</strong> Realiza seña para fecha <strong>${dot(f.fecha_evento)}</strong></p>
<ol class="upper-latin">
  <li>En caso de cancelación del evento por decisión de LA CLIENTA, no se reintegrarán las sumas abonadas en concepto de reserva o alquiler de salón. Respecto de los importes abonados en concepto de tarjetas de catering, se reconocerá un crédito equivalente al cincuenta por ciento (50%) de lo abonado, el cual podrá ser aplicado a una nueva fecha, sujeto a disponibilidad.</li>
  <li>En caso de suspensión o cancelación del evento por parte de CATERING-SALÓN, se devolverá la totalidad de las sumas percibidas en concepto de alquiler de salón y servicio de catering.</li>
</ol>
${f.adicionales_texto ? `<br/><p><strong>Adicionales contratados:</strong></p><div class="sub-indented">${linea(f.adicionales_texto)}</div>` : ""}
${f.notas ? `<br/><p><strong>Condiciones especiales / Notas:</strong></p><div class="sub-indented"><p style="white-space:pre-wrap">${f.notas}</p></div>` : ""}

<div class="anexo">
  <p><strong>6 - Anexo 1.</strong></p><br/>
  <div class="menu-row">
    <span><span class="check-box">${check(f.menu_1)}</span> Menú 1.</span>
    <span><span class="check-box">${check(f.menu_2)}</span> Menú 2.</span>
  </div>
  <p>Las características, composición y detalle del menú seleccionado serán especificadas por el servicio de catering en documento separado, el cual será entregado al contratante y se considerará parte integrante del presente acuerdo.</p>

  <br/>
  <div class="tarjetas">
    <p style="margin-bottom:6pt">Valor de tarjeta unitaria inicial:</p>
    <ol class="upper-latin">
      <li>Adultos: $<strong>${dot(f.valor_adulto)}</strong></li>
      <li>Adolescentes: $<strong>${dot(f.valor_adolescente)}</strong></li>
      <li>Niños de 3 a 10 años: $<strong>${dot(f.valor_nino)}</strong></li>
    </ol>
  </div>

  <p>Valor vigente hasta la fecha: <strong>${dot(f.valor_vigente_hasta)}</strong></p>
  <br/>
  <p style="margin-bottom:5pt">Actualización de precio tarjetas: Ajuste por IPC</p>
  <div class="cac-row">
    <span><span class="check-box">${check(f.ajuste_mensual)}</span> <s>Mensual</s></span>
    <span><span class="check-box">${check(f.ajuste_bimestral)}</span> Bimestral</span>
    <span><span class="check-box">${check(f.ajuste_trimestral)}</span> Trimestral</span>
  </div>
  <p>La actualización por IPC será aplicable exclusivamente a los valores de las tarjetas de catering. El alquiler del salón se regirá por las condiciones de actualización previstas en el punto 3.c del presente contrato.</p>

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
        <p class="firma-title">Firma de CATERING-SALÓN</p>
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

</td></tr>
</tbody>
</table>

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
            style={{ position: "relative", maxWidth: "210mm", padding: "15mm 20mm 20mm 20mm", fontFamily: "Arial, sans-serif", fontSize: "11pt", lineHeight: "1.7", color: "#000" }}
          >
            <style>{`.contract-cuerpo strong { font-weight: normal; }`}</style>

            {/* ── WATERMARK ── */}
            <img
              src="/images/LOGO%20PIE1.1%20mail.png"
              alt=""
              style={{ position: "absolute", top: "60mm", left: "50%", transform: "translateX(-50%)", width: "100%", opacity: 0.05, pointerEvents: "none", zIndex: 0 }}
            />

            {/* ── HEADER ── */}
            <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12pt", borderBottom: "1.5px solid #888", paddingBottom: "10pt" }}>
              {/* Left: contact info */}
              <div style={{ fontSize: "8pt", lineHeight: "1.6", color: "#444" }}>
                <div>Ruta A012 . Kilómetro 7, S2105 La Carolina, Santa Fe.</div>
                <div>+54 9 3412 61-4718</div>
                <div>carolinaeventos.arg@gmail.com | carolinaeventos.comercial@gmail.com</div>
                <div>www.carolinaeventos.com.ar</div>
              </div>
              {/* Right: logos */}
              <div style={{ display: "flex", alignItems: "center", gap: "14pt" }}>
                <img src="/images/LOGO%20PIE1.1%20mail.png" alt="Carolina Eventos" style={{ width: "150px", height: "auto" }} />
                <img src="/images/tonucos-catering.jpeg" alt="Tonucos Catering" style={{ width: "110px", height: "auto" }} />
              </div>
            </div>

            {/* ── TITLE ── */}
            <div style={{ position: "relative", zIndex: 1, textAlign: "center", fontSize: "13pt", textDecoration: "underline", margin: "6pt 0 16pt" }}>
              CONTRATO SERVICIO: TONUCOS CATERING
            </div>

            {/* ── CUERPO ── */}
            <div className="contract-cuerpo" style={{ position: "relative", zIndex: 1, textAlign: "justify" }}>

              {/* Párrafo intro */}
              <p style={{ marginBottom: "8pt" }}>
                Conste por el presente documento que el dia{" "}
                <Campo editMode={editMode} name="fecha_contrato" value={f.fecha_contrato} onChange={handleChange} className="w-36" />,
                celebran contrato de una parte, identificada con DNI N°36.055.780, Nombre y apellido completo{" "}
                <strong>TONONI JUAN MANUEL</strong> con domicilio en GUEMES 50 de la localidad de PIÑERO a quien en lo
                sucesivo se denominará <strong>CATERING-SALÓN</strong>; y de otra parte, identificado con DNI N°{" "}
                <Campo editMode={editMode} name="cliente_dni" value={f.cliente_dni} onChange={handleChange} placeholder="………" className="w-28" />
                {", "}Nombre y apellido completo{" "}
                <Campo editMode={editMode} name="cliente_nombre" value={f.cliente_nombre} onChange={handleChange} placeholder="……………………………" className="w-52" />
                {" "}con domicilio en{" "}
                <Campo editMode={editMode} name="cliente_domicilio" value={f.cliente_domicilio} onChange={handleChange} placeholder="……………………………………" className="w-64" />
                {", "}N° teléfono{" "}
                <Campo editMode={editMode} name="cliente_telefono" value={f.cliente_telefono} onChange={handleChange} placeholder="…………………………" className="w-40" />
                {", "}e-mail{" "}
                <Campo editMode={editMode} name="cliente_email" value={f.cliente_email} onChange={handleChange} placeholder="…………………………………" className="w-56" />
                {" "}a quien en lo sucesivo se denominará <strong>LA CLIENTA</strong>; en los términos y condiciones siguientes:
              </p>

              <p style={{ marginBottom: "6pt" }}>
                <strong>1 -</strong> LA SOCIEDAD DE CATERING-SALÓN es una persona jurídica, cuyo OBJETO SOCIAL es la prestación
                de servicios de ALQUILER DE SALÓN PARA EVENTOS Y SERVICIOS DE CATERING.
              </p>
              <p style={{ marginBottom: "6pt" }}>
                <strong>2 -</strong> LA CLIENTA es una persona natural, interesada en contratar los servicios ofrecidos por
                CATERING-SALÓN para la realización del evento detallado en el presente contrato.
              </p>

              {/* Objeto */}
              <p style={{ textAlign: "left", margin: "12pt 0 9pt" }}>
                OBJETO DEL CONTRATO
              </p>

              <p style={{ marginBottom: "8pt" }}>
                <strong>3 -</strong> CATERING-SALÓN alquila a LA CLIENTA el salón de eventos denominado{" "}
                <strong>CAROLINA EVENTOS</strong>, ubicado en Ruta A012, Km 6,5, para la realización del evento previsto para
                el día{" "}
                <Campo editMode={editMode} name="fecha_evento" value={f.fecha_evento} onChange={handleChange} placeholder="…………………………" className="w-36" />
                {" "}(evento de tipo{" "}
                <Campo editMode={editMode} name="tipo_evento" value={f.tipo_evento} onChange={handleChange} placeholder="…………………………" className="w-36" />).
                {" "}Por la contratación del referido servicio, LA CLIENTA abonará la suma de PESOS{" "}
                <Campo editMode={editMode} name="valor_total" value={f.valor_total} onChange={handleChange} placeholder="………………………" className="w-44" />
                {", "}en concepto de alquiler del salón.
              </p>

              <p style={{ marginBottom: "5pt" }}>A PAGAR DE LA SIGUIENTE FORMA:</p>

              <div style={{ paddingLeft: "16pt", marginBottom: "8pt" }}>
                <p style={{ marginBottom: "5pt" }}>
                  <strong>a - RESERVA:</strong> La clienta seña con la suma de PESOS{" "}
                  <Campo editMode={editMode} name="valor_senia" value={f.valor_senia} onChange={handleChange} placeholder="………………………" className="w-40" />
                  {" "}(……………………………………………………………………………………)
                </p>
                <p style={{ marginBottom: "5pt" }}>
                  <strong>b - CANTIDAD MÍNIMA GARANTIZADA:</strong> El presente servicio se contrata con una cantidad mínima
                  garantizada de{" "}
                  <Campo editMode={editMode} name="cantidad_minima" value={f.cantidad_minima} onChange={handleChange} placeholder="……" className="w-16" />
                  {" "}personas. En caso de que la asistencia final resulte inferior a dicha cantidad, el contratante se
                  compromete a abonar la suma de{" "}
                  <Campo editMode={editMode} name="monto_minimo" value={f.monto_minimo} onChange={handleChange} placeholder="………………………" className="w-40" />
                  {" "}(………………………………………), equivalente al valor mínimo pactado para el evento.
                </p>
                <p style={{ marginBottom: "5pt" }}>
                  <strong>c - NOTA:</strong> La cliente asume el compromiso de cancelar la totalidad del precio correspondiente
                  al alquiler del salón en un plazo máximo de doce (12) meses contados a partir de la fecha de firma del
                  presente contrato.
                </p>
              </div>

              <p style={{ paddingLeft: "16pt", marginBottom: "6pt" }}>
                Asimismo, el saldo total adeudado deberá encontrarse íntegramente abonado con una antelación mínima de treinta
                (30) días corridos previos a la fecha del evento. Si la contratación se realiza con menos de doce (12) meses de
                anticipación a la fecha del evento, la totalidad del importe deberá encontrarse cancelada, como máximo, veinte
                (20) días corridos antes de la celebración del evento.
              </p>
              <p style={{ paddingLeft: "16pt", marginBottom: "6pt" }}>
                En caso de no haberse completado el pago dentro de los plazos establecidos, el evento no será cancelado; sin
                embargo, el saldo pendiente será actualizado conforme al valor de lista vigente del alquiler del salón al
                momento de su efectiva cancelación, debiendo la cliente abonar la diferencia resultante antes de la realización
                del evento.
              </p>
              <p style={{ paddingLeft: "16pt", marginBottom: "8pt" }}>
                No obstante, si a siete (7) días corridos de la fecha prevista para el evento persistiera deuda pendiente
                correspondiente al alquiler del salón, el prestador podrá resolver el presente contrato y dejar sin efecto la
                reserva, perdiendo la cliente las sumas abonadas hasta ese momento en concepto de seña o pagos a cuenta, sin que
                corresponda devolución de las sumas abonadas ni indemnización alguna a favor de la cliente.
              </p>

              <p style={{ marginBottom: "5pt" }}><strong>4 -</strong> CATERING-SALÓN contará con los siguientes servicios:</p>

              <ol style={{ paddingLeft: "24pt", marginBottom: "8pt", listStyleType: "upper-latin" }}>
                {["GRUPO ELECTROGENO","COBERTURA MÉDICA","SONIDO E ILUMINACION","DJ","PANTALLA PARA REPRODUCCIÓN DE VIDEO","MESAS","SILLAS","JUEGO DE LIVING INTERIOR","MANTELERÍA","PERSONAL DE LIMPIEZA","CLIMATIZACIÓN","COTILLÓN"].map(s => (
                  <li key={s} style={{ marginBottom: "2pt" }}>{s}</li>
                ))}
              </ol>

              <p style={{ marginBottom: "5pt" }}>
                <strong>NOTA PUNTO L:</strong> El presente servicio incluye, sin costo adicional, el Combo N.º 1 de cotillón,
                conforme a la descripción y características vigentes establecidas por CAROLINA EVENTOS al momento de la
                celebración del evento.
              </p>
              <p style={{ marginBottom: "5pt" }}>
                En caso de que LA CLIENTA desee contratar una opción superior, podrá optar por el Combo N.º 2 o el Combo N.º 3,
                abonando la diferencia económica correspondiente respecto del Combo N.º 1. Dicha elección deberá quedar
                expresamente consignada en el presente contrato o en un anexo complementario firmado por ambas partes.
              </p>
              <p style={{ marginBottom: "5pt" }}>
                Los valores de actualización y diferencias entre combos serán informados por CAROLINA EVENTOS y deberán
                encontrarse cancelados junto con el saldo total del evento, respetando los plazos de pago establecidos en el
                presente contrato.
              </p>
              <p style={{ paddingLeft: "16pt", marginBottom: "8pt" }}>
                <strong>Combo de cotillón seleccionado:</strong>{" "}
                <Campo editMode={editMode} name="combo_cotillon" value={f.combo_cotillon} onChange={handleChange} placeholder="N.º 1" className="w-28" />
              </p>

              <p style={{ marginBottom: "5pt" }}>
                <strong>5 -</strong> Realiza seña para fecha{" "}
                <Campo editMode={editMode} name="fecha_evento" value={f.fecha_evento} onChange={handleChange} placeholder="……………………………" className="w-40" />
              </p>

              <ol style={{ paddingLeft: "24pt", marginBottom: "10pt", listStyleType: "upper-latin" }}>
                <li style={{ marginBottom: "5pt" }}>
                  En caso de cancelación del evento por decisión de LA CLIENTA, no se reintegrarán las sumas abonadas en
                  concepto de reserva o alquiler de salón. Respecto de los importes abonados en concepto de tarjetas de
                  catering, se reconocerá un crédito equivalente al cincuenta por ciento (50%) de lo abonado, el cual podrá ser
                  aplicado a una nueva fecha, sujeto a disponibilidad.
                </li>
                <li style={{ marginBottom: "5pt" }}>
                  En caso de suspensión o cancelación del evento por parte de CATERING-SALÓN, se devolverá la totalidad de las
                  sumas percibidas en concepto de alquiler de salón y servicio de catering.
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
                <p style={{ fontWeight: "bold", marginBottom: "8pt" }}><strong>6 - Anexo 1.</strong></p>

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

                <p style={{ marginBottom: "10pt" }}>
                  Las características, composición y detalle del menú seleccionado serán especificadas por el servicio de
                  catering en documento separado, el cual será entregado al contratante y se considerará parte integrante del
                  presente acuerdo.
                </p>

                {/* Tarjetas */}
                <div style={{ marginBottom: "8pt" }}>
                  <p style={{ marginBottom: "5pt" }}>Valor de tarjeta unitaria inicial:</p>
                  <ol style={{ paddingLeft: "24pt", listStyleType: "upper-latin" }}>
                    <li style={{ marginBottom: "4pt" }}>
                      Adultos: $
                      <Campo editMode={editMode} name="valor_adulto" value={f.valor_adulto} onChange={handleChange} placeholder="…………………………………………" className="w-52" />
                    </li>
                    <li style={{ marginBottom: "4pt" }}>
                      Adolescentes: $
                      <Campo editMode={editMode} name="valor_adolescente" value={f.valor_adolescente} onChange={handleChange} placeholder="…………………………………" className="w-52" />
                    </li>
                    <li style={{ marginBottom: "4pt" }}>
                      Niños de 3 a 10 años: $
                      <Campo editMode={editMode} name="valor_nino" value={f.valor_nino} onChange={handleChange} placeholder="………………………………………………" className="w-52" />
                    </li>
                  </ol>
                </div>

                <p style={{ marginBottom: "8pt" }}>
                  Valor vigente hasta la fecha:{" "}
                  <Campo editMode={editMode} name="valor_vigente_hasta" value={f.valor_vigente_hasta} onChange={handleChange} placeholder="………………………………………………" className="w-52" />
                </p>

                <p style={{ marginBottom: "5pt" }}>Actualización de precio tarjetas: Ajuste por IPC</p>
                <div style={{ display: "flex", gap: "20pt", paddingLeft: "8pt", marginBottom: "8pt" }}>
                  {[
                    ["ajuste_mensual","Mensual", true],
                    ["ajuste_bimestral","Bimestral", false],
                    ["ajuste_trimestral","Trimestral", false],
                  ].map(([nm, label, strike]) => (
                    <label key={nm} style={{ display:"flex", alignItems:"center", gap:"5pt", cursor:"pointer", fontSize:"11pt" }}>
                      {editMode ? (
                        <input type="checkbox" name={nm} checked={f[nm]} onChange={handleChange} />
                      ) : (
                        <span style={{ display:"inline-block", width:"13px", height:"13px", border:"1px solid #555", textAlign:"center", lineHeight:"13px", fontSize:"9pt" }}>
                          {f[nm] ? "✓" : ""}
                        </span>
                      )}
                      <span style={strike ? { textDecoration: "line-through", color: "#999" } : undefined}>{label}</span>
                    </label>
                  ))}
                </div>

                <p style={{ marginBottom: "14pt" }}>
                  La actualización por IPC será aplicable exclusivamente a los valores de las tarjetas de catering. El alquiler
                  del salón se regirá por las condiciones de actualización previstas en el punto 3.c del presente contrato.
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
                      <p style={{ fontSize: "10pt", fontWeight: "600" }}>Firma de CATERING-SALÓN</p>
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
