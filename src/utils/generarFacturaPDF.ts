import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

const fmtFecha = (s: string) =>
  new Date(s).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })

export type LineaFactura = {
  nombre: string
  cantidad: number
  precio: number
}

export type CuotaFactura = {
  numero: number
  fecha: string
  valor: number
}

export type DatosFactura = {
  numero: string
  fecha: string
  cliente: string
  tipo: 'contado' | 'credito'
  estado: string
  lineas: LineaFactura[]
  cuotas?: CuotaFactura[]
  vendedor?: string
}

const AZUL    = [30, 64, 175]  as [number, number, number]
const AZUL_L  = [219, 234, 254] as [number, number, number]
const GRIS    = [107, 114, 128] as [number, number, number]
const NEGRO   = [17, 24, 39]   as [number, number, number]
const BLANCO  = [255, 255, 255] as [number, number, number]

export function generarFacturaPDF(datos: DatosFactura) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()
  let y = 0

  // ── Cabecera azul ──────────────────────────────────────
  doc.setFillColor(...AZUL)
  doc.rect(0, 0, W, 38, 'F')

  doc.setTextColor(...BLANCO)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('MercaApp', 14, 16)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('Sistema de Ventas y Crédito', 14, 22)
  doc.text('Cali, Colombia · mercaapp@tienda.co', 14, 27)

  // Número de factura (derecha)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  const label = datos.tipo === 'credito' ? 'FACTURA CRÉDITO' : 'RECIBO DE VENTA'
  doc.text(label, W - 14, 13, { align: 'right' })

  doc.setFontSize(14)
  doc.text(`#${datos.numero}`, W - 14, 21, { align: 'right' })

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(fmtFecha(datos.fecha), W - 14, 28, { align: 'right' })

  y = 46

  // ── Datos del cliente / venta ──────────────────────────
  doc.setFillColor(...AZUL_L)
  doc.roundedRect(14, y, W - 28, 26, 3, 3, 'F')

  doc.setTextColor(...GRIS)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')

  const col1x = 18, col2x = W / 2 + 4
  doc.text('CLIENTE', col1x, y + 7)
  doc.text('TIPO DE VENTA', col2x, y + 7)
  doc.text('ESTADO', col2x + 52, y + 7)

  doc.setTextColor(...NEGRO)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text(datos.cliente || 'Mostrador', col1x, y + 14)
  doc.text(datos.tipo.toUpperCase(), col2x, y + 14)

  const estadoColor = datos.estado === 'despachado' ? [22, 163, 74] as [number,number,number] : [217, 119, 6] as [number,number,number]
  doc.setTextColor(...estadoColor)
  doc.text(datos.estado.toUpperCase(), col2x + 52, y + 14)

  if (datos.vendedor) {
    doc.setTextColor(...GRIS)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text('VENDEDOR', col1x, y + 20)
    doc.setTextColor(...NEGRO)
    doc.setFontSize(9)
    doc.text(datos.vendedor, col1x, y + 25)
  }

  y += 34

  // ── Tabla de productos ─────────────────────────────────
  doc.setTextColor(...AZUL)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('DETALLE DE PRODUCTOS', 14, y)
  y += 4

  const filas = datos.lineas.map(l => [
    l.nombre,
    l.cantidad.toString(),
    fmt(l.precio),
    fmt(l.precio * l.cantidad),
  ])

  const subtotal = datos.lineas.reduce((s, l) => s + l.precio * l.cantidad, 0)

  autoTable(doc, {
    startY: y,
    head: [['Producto', 'Cant.', 'Precio Unit.', 'Subtotal']],
    body: filas,
    foot: [
      [{ content: 'TOTAL', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold', fillColor: AZUL_L, textColor: NEGRO } },
       { content: fmt(subtotal), styles: { fontStyle: 'bold', fillColor: AZUL_L, textColor: AZUL } }],
    ],
    headStyles: { fillColor: AZUL, textColor: BLANCO, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: NEGRO },
    footStyles: { fontSize: 10 },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { halign: 'center', cellWidth: 18 },
      2: { halign: 'right', cellWidth: 38 },
      3: { halign: 'right', cellWidth: 38 },
    },
    margin: { left: 14, right: 14 },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    theme: 'grid',
  })

  y = (doc as any).lastAutoTable.finalY + 8

  // ── Plan de cuotas (solo crédito) ──────────────────────
  if (datos.tipo === 'credito' && datos.cuotas && datos.cuotas.length > 0) {
    // nueva página si no cabe
    if (y > 220) { doc.addPage(); y = 18 }

    doc.setTextColor(...AZUL)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('PLAN DE PAGOS', 14, y)
    y += 4

    autoTable(doc, {
      startY: y,
      head: [['Cuota N°', 'Fecha de Pago', 'Valor']],
      body: datos.cuotas.map(c => [
        `Cuota ${c.numero}`,
        fmtFecha(c.fecha),
        fmt(c.valor),
      ]),
      headStyles: { fillColor: [79, 70, 229], textColor: BLANCO, fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 9, textColor: NEGRO },
      columnStyles: {
        0: { cellWidth: 28 },
        1: { cellWidth: 60 },
        2: { halign: 'right', cellWidth: 38 },
      },
      margin: { left: 14, right: 14 },
      alternateRowStyles: { fillColor: [238, 242, 255] },
      theme: 'grid',
    })

    y = (doc as any).lastAutoTable.finalY + 8

    // Nota informativa
    doc.setFillColor(255, 251, 235)
    doc.roundedRect(14, y, W - 28, 12, 2, 2, 'F')
    doc.setTextColor(120, 53, 15)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text('⚠  El incumplimiento de cuotas puede generar intereses de mora. Comuníquese con la tienda para más información.', 18, y + 7)
    y += 18
  }

  // ── Firmas ─────────────────────────────────────────────
  if (y > 240) { doc.addPage(); y = 18 }

  y += 8
  const firmaY = y + 20
  doc.setDrawColor(...GRIS)
  doc.setLineWidth(0.3)
  doc.line(14, firmaY, 80, firmaY)
  doc.line(W - 80, firmaY, W - 14, firmaY)

  doc.setTextColor(...GRIS)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('Firma del cliente', 47, firmaY + 5, { align: 'center' })
  doc.text('Firma / Sello MercaApp', W - 47, firmaY + 5, { align: 'center' })

  // ── Pie de página ──────────────────────────────────────
  const pageH = doc.internal.pageSize.getHeight()
  doc.setFillColor(...AZUL)
  doc.rect(0, pageH - 12, W, 12, 'F')
  doc.setTextColor(...BLANCO)
  doc.setFontSize(7.5)
  doc.text('MercaApp — Sistema de Ventas y Crédito  ·  Este documento es un comprobante de venta', W / 2, pageH - 5, { align: 'center' })

  doc.save(`Factura-${datos.numero}.pdf`)
}
