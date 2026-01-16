const SHEET_PAGES = 'pages'
const SHEET_BLOCKS = 'blocks'
const SHEET_SINGLE = 'book'
const BOOK_VERSION = '1.0.0'
const BOOK_PAGE_SIZE = 'A5'
const INACTIVE_SEGMENT_COLOR = '#7a7a7a'

function doGet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  const pagesSheet = ss.getSheetByName(SHEET_PAGES)
  const blocksSheet = ss.getSheetByName(SHEET_BLOCKS)

  if (pagesSheet && blocksSheet) {
    const payload = buildFromSplitSheets(ss, pagesSheet, blocksSheet)
    return jsonOutput(payload)
  }

  const singleSheet =
    ss.getSheetByName(SHEET_SINGLE) || ss.getSheetByName('main') || ss.getSheets()[0]

  if (!singleSheet) {
    return jsonOutput({ error: 'Missing data sheet.' }, 400)
  }

  const payload = buildFromSingleSheet(ss, singleSheet)
  return jsonOutput(payload)
}

function buildFromSplitSheets(ss, pagesSheet, blocksSheet) {
  const pages = readRows(pagesSheet)
    .map(buildPage)
    .filter(Boolean)
    .sort((a, b) => a.pageNo - b.pageNo)

  const blockRows = readRows(blocksSheet)
    .map(buildBlockRow)
    .filter(Boolean)

  const blocksByPage = groupBlocks(blockRows)

  pages.forEach((page) => {
    const entries = blocksByPage[page.pageNo] || []
    entries.sort((a, b) => a.order - b.order)
    page.blocks = entries.map((entry) => entry.block)
  })

  return {
    meta: {
      title: ss.getName(),
      version: BOOK_VERSION,
      pageSize: BOOK_PAGE_SIZE,
      updated: formatDate(new Date()),
    },
    pages: pages,
  }
}

function buildFromSingleSheet(ss, sheet) {
  const rows = readRows(sheet)
  const tags = buildTagIndex(rows)
  const steps = buildStepIndex(rows)
  const pages = buildPagesFromRows(rows, steps, tags)

  return {
    meta: {
      title: ss.getName(),
      version: BOOK_VERSION,
      pageSize: BOOK_PAGE_SIZE,
      updated: formatDate(new Date()),
    },
    pages: pages,
  }
}

function readRows(sheet) {
  const values = sheet.getDataRange().getValues()
  if (!values.length) return []

  const headers = values[0].map((value) => String(value).trim().toLowerCase())
  const rows = values.slice(1)

  return rows
    .filter((row) => row.some((cell) => cell !== '' && cell !== null))
    .map((row) => {
      const record = {}
      headers.forEach((header, index) => {
        if (!header) return
        record[header] = row[index]
      })
      return record
    })
}

function buildPage(row) {
  const pageNo = getNumber(row, 'page_no')
  if (!pageNo) return null

  const title = getString(row, 'title')
  const headerColor = getString(row, 'header_color')
  const frameColor = getString(row, 'frame_color')
  const headerTextColor = getString(row, 'header_text_color')

  const theme = {}
  if (headerColor) theme.headerColor = headerColor
  if (frameColor) theme.frameColor = frameColor
  if (headerTextColor) theme.headerTextColor = headerTextColor

  return {
    pageNo: pageNo,
    title: title || `Page ${pageNo}`,
    outerLabel: getString(row, 'outer_label'),
    innerLabel: getString(row, 'inner_label'),
    sideSegments: parseSegments(getString(row, 'side_segments')),
    theme: theme,
    blocks: [],
  }
}

function buildBlockRow(row, index) {
  const pageNo = getNumber(row, 'page_no')
  if (!pageNo) return null

  const type = normalizeType(getString(row, 'type'))
  if (!type) return null

  const order = getNumber(row, 'order') || index + 1
  const base = {
    id: getString(row, 'id') || `block-${pageNo}-${order}`,
    type: type,
    font: normalizeToken(getString(row, 'font'), ['gothic', 'serif', 'display']),
    align: normalizeToken(getString(row, 'align'), ['left', 'center', 'right']),
  }

  let block = base

  if (type === 'heading') {
    block = {
      ...base,
      text: getString(row, 'text'),
      size: normalizeToken(getString(row, 'size'), ['sm', 'md', 'lg']),
      variant: normalizeToken(getString(row, 'variant'), ['label', 'line']),
    }
  } else if (type === 'text' || type === 'note') {
    block = {
      ...base,
      text: getString(row, 'text'),
      size: normalizeToken(getString(row, 'size'), ['sm', 'md', 'lg']),
    }
  } else if (type === 'image') {
    block = {
      ...base,
      src: normalizeDriveUrl(getString(row, 'image_url')),
      alt: getString(row, 'alt'),
      caption: getString(row, 'caption'),
      ratio: getString(row, 'ratio'),
      frame: normalizeToken(getString(row, 'frame'), ['line', 'shadow']),
    }
  } else if (type === 'list') {
    block = {
      ...base,
      items: parseListItems(getString(row, 'items')),
    }
  } else if (type === 'hint') {
    const body = getString(row, 'body') || getString(row, 'text')
    block = {
      ...base,
      title: getString(row, 'title'),
      body: body,
      answer: getString(row, 'answer'),
      markerColor: getString(row, 'marker_color'),
    }
  } else if (type === 'toc') {
    block = {
      ...base,
      entries: parseTocEntries(getString(row, 'entries') || getString(row, 'items')),
      columns: getNumber(row, 'columns'),
    }
  } else if (type === 'spacer') {
    block = {
      ...base,
      sizeMm: getNumber(row, 'size_mm') || getNumber(row, 'size'),
    }
  }

  return { pageNo: pageNo, order: order, block: block }
}

function buildPagesFromRows(rows, steps, tags) {
  const pagesMap = {}

  rows.forEach((row, index) => {
    const pageNo = getNumber(row, 'page_no') || getNumber(row, 'page')
    if (!pageNo) return

    if (!pagesMap[pageNo]) {
      pagesMap[pageNo] = {
        pageNo: pageNo,
        rows: [],
      }
    }

    pagesMap[pageNo].rows.push({
      row: row,
      index: index,
    })
  })

  return Object.keys(pagesMap)
    .map((key) => pagesMap[key])
    .sort((a, b) => a.pageNo - b.pageNo)
    .map((pageEntry) => buildSinglePage(pageEntry, steps, tags))
}

function buildSinglePage(pageEntry, steps, tags) {
  const rows = pageEntry.rows
  const pageNo = pageEntry.pageNo
  const title = getFirstString(rows, ['title', 'page_title', 'step']) || `Page ${pageNo}`
  const stepInfo = getFirstStep(rows)
  const currentStepLabel = stepInfo.label
  const currentStepColor = stepInfo.color || deriveStepColor(currentStepLabel)
  const theme = buildTheme(rows, currentStepColor)
  const sideSegments = buildSideSegments(steps, currentStepLabel)

  const blocks = []
  const orderedRows = rows
    .map((entry) => ({
      row: entry.row,
      order:
        getNumber(entry.row, 'ord') ||
        getNumber(entry.row, 'order') ||
        entry.index + 1,
    }))
    .sort((a, b) => a.order - b.order)

  orderedRows.forEach((entry) => {
    const rowBlocks = parseRowBlocks(entry.row, tags, currentStepColor)
    rowBlocks.forEach((block) => blocks.push(block))
  })

  return {
    pageNo: pageNo,
    title: title,
    outerLabel: '',
    innerLabel: '',
    sideSegments: sideSegments,
    theme: theme,
    blocks: blocks,
  }
}

function buildTheme(rows, fallbackColor) {
  const headerColor = getFirstString(rows, ['header_color']) || fallbackColor
  const frameColor = getFirstString(rows, ['frame_color']) || fallbackColor
  const headerTextColor = getFirstString(rows, ['header_text_color']) || '#ffffff'
  return {
    headerColor: headerColor,
    frameColor: frameColor,
    headerTextColor: headerTextColor,
  }
}

function buildSideSegments(steps, currentLabel) {
  if (!steps.length) return []
  const index = steps.findIndex((step) => step.label === currentLabel)
  const segments = []

  steps.forEach((step, idx) => {
    const isActive = index >= 0 ? idx <= index : true
    segments.push({
      label: isActive ? step.label : '',
      color: isActive ? step.color : INACTIVE_SEGMENT_COLOR,
    })
  })

  return segments
}

function buildTagIndex(rows) {
  const map = {}
  rows.forEach((row) => {
    const pageNo = getNumber(row, 'page_no') || getNumber(row, 'page')
    if (!pageNo) return
    const tags = parseTags(getString(row, 'page_tag') || getString(row, 'tags'))
    tags.forEach((tag) => {
      if (!map[tag]) {
        map[tag] = []
      }
      if (map[tag].indexOf(pageNo) === -1) {
        map[tag].push(pageNo)
      }
    })
  })

  Object.keys(map).forEach((tag) => {
    map[tag].sort((a, b) => a - b)
  })

  return map
}

function buildStepIndex(rows) {
  const list = []
  const seen = {}
  rows.forEach((row) => {
    const token = parseStepToken(getString(row, 'step'))
    if (!token.label || seen[token.label]) return
    const color = token.color || deriveStepColor(token.label)
    list.push({ label: token.label, color: color })
    seen[token.label] = true
  })
  return list
}

function parseRowBlocks(row, tags, markerColor) {
  const blocks = []
  const body = getString(row, 'body')
  const imageUrl = normalizeDriveUrl(getString(row, 'image'))
  const lines = body ? String(body).split(/\r?\n/) : []
  const textLines = []
  let tocEntries = []

  const flushText = () => {
    if (!textLines.length) return
    const block = buildTextBlock(textLines, markerColor)
    if (block) {
      blocks.push(block)
    }
    textLines.length = 0
  }

  const flushToc = () => {
    if (!tocEntries.length) return
    blocks.push({
      id: `toc-${Math.random().toString(36).slice(2, 8)}`,
      type: 'toc',
      entries: tocEntries,
      columns: 1,
    })
    tocEntries = []
  }

  lines.forEach((rawLine) => {
    const line = String(rawLine || '')
    const trimmed = line.trim()

    if (trimmed.startsWith('#page')) {
      const entry = parsePageDirective(trimmed, tags)
      if (entry) tocEntries.push(entry)
      return
    }

    if (trimmed.startsWith('#img') || trimmed.startsWith('#image')) {
      flushToc()
      flushText()
      const urlFromLine = trimmed.replace(/^#image/i, '').replace(/^#img/i, '').trim()
      const src = normalizeDriveUrl(urlFromLine || imageUrl)
      blocks.push({
        id: `img-${Math.random().toString(36).slice(2, 8)}`,
        type: 'image',
        src: src,
        caption: getString(row, 'caption'),
        ratio: getString(row, 'ratio'),
        frame: getString(row, 'frame'),
      })
      return
    }

    textLines.push(line)
  })

  flushToc()
  flushText()

  if (!lines.length && imageUrl) {
    blocks.push({
      id: `img-${Math.random().toString(36).slice(2, 8)}`,
      type: 'image',
      src: imageUrl,
      caption: getString(row, 'caption'),
      ratio: getString(row, 'ratio'),
      frame: getString(row, 'frame'),
    })
  }

  return blocks
}

function parsePageDirective(line, tags) {
  const tagMatch = line.match(/tag:([^\s]+)/i)
  const labelMatch = line.match(/label:(.+)$/i)
  const tag = tagMatch ? tagMatch[1].trim() : ''
  const label = labelMatch ? labelMatch[1].trim() : tag
  if (!label) return null
  const pages = tag && tags[tag] ? tags[tag] : []
  const pageText = formatPageRanges(pages)
  return {
    label: label,
    pageText: pageText,
    tag: tag,
    emphasis: true,
  }
}

function buildTextBlock(lines, markerColor) {
  const firstIndex = lines.findIndex((line) => String(line).trim() !== '')
  if (firstIndex < 0) {
    return null
  }

  const firstLine = String(lines[firstIndex]).trim()
  const hintMatch = firstLine.match(/^■\s*(.+)$/)
  if (hintMatch) {
    const title = hintMatch[1].trim()
    const bodyLines = lines.slice(firstIndex + 1)
    const answerLines = []
    const filtered = []
    bodyLines.forEach((line) => {
      const trimmed = String(line).trim()
      if (trimmed.startsWith('答え')) {
        answerLines.push(trimmed)
      } else {
        filtered.push(line)
      }
    })

    return {
      id: `hint-${Math.random().toString(36).slice(2, 8)}`,
      type: 'hint',
      title: title,
      body: filtered.join('\n').trim(),
      answer: answerLines.join('\n').trim(),
      markerColor: markerColor,
    }
  }

  return {
    id: `text-${Math.random().toString(36).slice(2, 8)}`,
    type: 'text',
    text: lines.join('\n').trim(),
  }
}

function getFirstString(rows, keys) {
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i].row
    for (let j = 0; j < keys.length; j += 1) {
      const value = getString(row, keys[j])
      if (value) return value
    }
  }
  return ''
}

function getFirstStep(rows) {
  for (let i = 0; i < rows.length; i += 1) {
    const token = parseStepToken(getString(rows[i].row, 'step'))
    if (token.label) return token
  }
  return { label: '', color: '' }
}

function groupBlocks(entries) {
  const map = {}
  entries.forEach((entry) => {
    if (!map[entry.pageNo]) {
      map[entry.pageNo] = []
    }
    map[entry.pageNo].push(entry)
  })
  return map
}

function parseSegments(value) {
  if (!value) return []
  const parts = String(value)
    .split(/\s*\|\s*|\n/)
    .map((item) => item.trim())
    .filter(Boolean)

  return parts.map((part) => {
    let label = part
    let color = ''

    if (part.includes(':')) {
      const split = part.split(':')
      label = split[0].trim()
      color = split.slice(1).join(':').trim()
    } else if (part.includes('#')) {
      const index = part.indexOf('#')
      label = part.slice(0, index).trim()
      color = part.slice(index).trim()
    } else if (part.includes(',')) {
      const split = part.split(',')
      label = split[0].trim()
      color = (split[1] || '').trim()
    }

    if (color && !color.startsWith('#')) {
      color = `#${color}`
    }

    return { label: label, color: color }
  })
}

function parseListItems(value) {
  if (!value) return []
  return String(value)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split('::').map((item) => item.trim())
      return {
        label: parts[0] || '',
        text: parts.slice(1).join('::'),
      }
    })
}

function parseTocEntries(value) {
  if (!value) return []
  return String(value)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split('::').map((item) => item.trim())
      return {
        label: parts[0] || '',
        page: Number(parts[1]) || 0,
        tag: parts[2] || '',
      }
    })
}

function parseTags(value) {
  if (!value) return []
  return String(value)
    .split(/[\s,|]+/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function parseStepToken(value) {
  if (!value) return { label: '', color: '' }
  const raw = String(value).trim()
  if (!raw) return { label: '', color: '' }

  let label = raw
  let color = ''

  if (raw.includes('#')) {
    const index = raw.indexOf('#')
    label = raw.slice(0, index).trim()
    color = raw.slice(index).trim()
  } else if (raw.includes(':')) {
    const parts = raw.split(':')
    label = parts[0].trim()
    color = parts.slice(1).join(':').trim()
  } else if (raw.includes(',')) {
    const parts = raw.split(',')
    label = parts[0].trim()
    color = (parts[1] || '').trim()
  }

  if (color && !color.startsWith('#')) {
    color = `#${color}`
  }

  return { label: label, color: color }
}

function deriveStepColor(label) {
  if (!label) return INACTIVE_SEGMENT_COLOR
  const lower = String(label).toLowerCase()
  let base = INACTIVE_SEGMENT_COLOR

  if (lower.startsWith('1st')) {
    base = '#cc4b5e'
  } else if (lower.startsWith('2nd')) {
    base = '#2e71b3'
  } else if (lower.startsWith('3rd')) {
    base = '#3c8f45'
  } else if (lower.startsWith('last')) {
    base = '#c59319'
  }

  if (lower === '1st' || lower === '2nd' || lower === '3rd' || lower === 'last') {
    return base
  }

  return adjustColor(base, stringHash(label))
}

function adjustColor(hex, seed) {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex
  const delta = (seed % 31) - 15
  const r = clamp(rgb.r + delta)
  const g = clamp(rgb.g + delta)
  const b = clamp(rgb.b + delta)
  return rgbToHex(r, g, b)
}

function stringHash(value) {
  let hash = 0
  const str = String(value)
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

function hexToRgb(hex) {
  const normalized = hex.replace('#', '')
  if (normalized.length !== 6) return null
  const num = parseInt(normalized, 16)
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  }
}

function rgbToHex(r, g, b) {
  return `#${[r, g, b]
    .map((value) => {
      const hex = value.toString(16)
      return hex.length === 1 ? `0${hex}` : hex
    })
    .join('')}`
}

function clamp(value) {
  return Math.max(0, Math.min(255, value))
}

function normalizeDriveUrl(value) {
  if (!value) return ''
  const url = String(value).trim()
  if (url.includes('lh3.googleusercontent.com')) return url
  if (url.includes('uc?export=view')) return url

  const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
  if (fileMatch && fileMatch[1]) {
    return `https://drive.google.com/uc?export=view&id=${fileMatch[1]}`
  }

  const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/)
  if (idMatch && idMatch[1]) {
    return `https://drive.google.com/uc?export=view&id=${idMatch[1]}`
  }

  return url
}

function normalizeType(value) {
  return normalizeToken(value, [
    'heading',
    'text',
    'note',
    'image',
    'list',
    'hint',
    'toc',
    'spacer',
  ])
}

function normalizeToken(value, allowed) {
  if (!value) return ''
  const token = String(value).trim().toLowerCase()
  return allowed.indexOf(token) >= 0 ? token : ''
}

function getString(row, key) {
  const value = row[key]
  if (value === undefined || value === null) return ''
  return String(value).trim()
}

function getNumber(row, key) {
  const value = row[key]
  if (value === undefined || value === null || value === '') return 0
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function formatDate(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd')
}

function formatPageRanges(values) {
  if (!values || !values.length) return ''
  const rangeSeparator = String.fromCharCode(0xff5e)
  const unique = values
    .filter((value) => value)
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => a - b)

  const ranges = []
  let start = unique[0]
  let prev = unique[0]

  for (let i = 1; i < unique.length; i += 1) {
    const current = unique[i]
    if (current === prev + 1) {
      prev = current
      continue
    }
    ranges.push(start === prev ? `${start}` : `${start}${rangeSeparator}${prev}`)
    start = current
    prev = current
  }

  ranges.push(start === prev ? `${start}` : `${start}${rangeSeparator}${prev}`)
  return ranges.join(', ')
}

function jsonOutput(payload, statusCode) {
  const output = ContentService.createTextOutput(JSON.stringify(payload))
  output.setMimeType(ContentService.MimeType.JSON)
  if (statusCode) {
    output.setStatusCode(statusCode)
  }
  return output
}
