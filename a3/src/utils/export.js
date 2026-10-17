// BR E.4 - export table data as CSV or PDF
import { jsPDF } from 'jspdf'
import { autoTable } from 'jspdf-autotable'

function cellValue(row, column) {
  const value = column.exportValue ? column.exportValue(row) : column.format ? column.format(row[column.key], row) : row[column.key]
  return value ?? ''
}

function download(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = Object.assign(document.createElement('a'), { href: url, download: filename })
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function toCsv(columns, rows) {
  const escape = (value) => {
    const text = String(value)
    // Prefix formula characters so spreadsheets do not run them (CSV injection)
    const safe = /^[=+\-@]/.test(text) ? `'${text}` : text
    return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
  }
  const lines = [columns.map((column) => escape(column.label))]
  rows.forEach((row) => lines.push(columns.map((column) => escape(cellValue(row, column)))))
  return lines.map((line) => line.join(',')).join('\r\n')
}

export function exportCsv(filename, columns, rows) {
  download(new Blob([`﻿${toCsv(columns, rows)}`], { type: 'text/csv;charset=utf-8' }), filename)
}

export function buildPdf(title, columns, rows) {
  const doc = new jsPDF({ orientation: columns.length > 5 ? 'landscape' : 'portrait' })
  doc.setFontSize(16)
  doc.text(title, 14, 18)
  doc.setFontSize(9)
  doc.setTextColor(96, 112, 105)
  doc.text(`UrbanCanopy Melbourne · generated ${new Date().toLocaleString('en-AU')}`, 14, 25)
  autoTable(doc, {
    startY: 30,
    head: [columns.map((column) => column.label)],
    body: rows.map((row) => columns.map((column) => String(cellValue(row, column)))),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [15, 104, 73] },
  })
  return doc
}

export function exportPdf(filename, title, columns, rows) {
  buildPdf(title, columns, rows).save(filename)
}

export function pdfBase64(title, columns, rows) {
  return buildPdf(title, columns, rows).output('datauristring').split(',')[1]
}
