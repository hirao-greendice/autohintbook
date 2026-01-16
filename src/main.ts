import './style.css'
import { loadBookData } from './data/loadBook'
import type {
  Align,
  Block,
  FontToken,
  HintBlock,
  ImageBlock,
  ListBlock,
  PageData,
  PageSideSegment,
  TextSize,
  TocBlock,
  BookData,
} from './data/types'

const appRoot = document.querySelector<HTMLDivElement>('#app')

if (!appRoot) {
  throw new Error('Missing #app container')
}
const app = appRoot

void init()

async function init() {
  const book = await loadBookData()
  renderApp(book)
}

function renderApp(book: BookData) {
  const pageCount = book.pages.length

  app.innerHTML = `
    <div class="app">
      <header class="app-header">
        <div>
          <p class="eyebrow">${escapeHtml(book.meta.title)}</p>
          <h1 class="title">Auto Hintbook Preview</h1>
          <p class="subtitle">A5 portrait layout with block-based content and manual TOC.</p>
        </div>
        <div class="meta">
          <div class="badge">${book.meta.pageSize} print</div>
          <div class="badge">${pageCount} pages</div>
          <div class="badge">updated ${book.meta.updated}</div>
        </div>
      </header>
      <section class="toolbar">
        <button class="btn" id="download-pdf" type="button">Download PDF</button>
        <div class="source">Source: ${escapeHtml(getSourceLabel())}</div>
      </section>
      <main class="page-deck">
        ${book.pages.map(renderPage).join('')}
      </main>
    </div>
  `

  const downloadButton = document.querySelector<HTMLButtonElement>('#download-pdf')
  downloadButton?.addEventListener('click', () => {
    window.print()
  })
}

function renderPage(page: PageData): string {
  const isOdd = page.pageNo % 2 !== 0
  const leftLabel = isOdd ? page.innerLabel : page.outerLabel
  const rightLabel = isOdd ? page.outerLabel : page.innerLabel
  const sideSegments = page.sideSegments ?? []
  const activeSide = isOdd ? 'right' : 'left'
  const theme = page.theme ?? {}
  const themeVars = [
    theme.headerColor && `--page-accent: ${theme.headerColor}`,
    theme.frameColor && `--page-frame: ${theme.frameColor}`,
    theme.outerColor && `--page-outer: ${theme.outerColor}`,
    theme.innerColor && `--page-inner: ${theme.innerColor}`,
    theme.headerTextColor && `--page-header-ink: ${theme.headerTextColor}`,
  ]
    .filter(Boolean)
    .join('; ')

  return `
    <article class="page" style="${themeVars}">
      <div class="page-header">
        <div class="page-title">${escapeHtml(page.title)}</div>
      </div>
      ${renderSide('left', leftLabel, activeSide === 'left' ? sideSegments : [])}
      ${renderSide('right', rightLabel, activeSide === 'right' ? sideSegments : [])}
      <div class="page-content">
        ${page.blocks.map(renderBlock).join('')}
      </div>
      <div class="page-footer">${page.pageNo}</div>
    </article>
  `
}

function renderSide(
  side: 'left' | 'right',
  label?: string,
  segments: PageSideSegment[] = [],
): string {
  const hasLabel = Boolean(label)
  const segmentHtml = segments.length
    ? segments
        .map(
          (segment) => `
            <div class="side-segment" style="background:${segment.color}">
              <span>${escapeHtml(segment.label)}</span>
            </div>
          `,
        )
        .join('')
    : ''
  return `
    <div class="page-side page-side-${side} ${segments.length ? '' : 'page-side--empty'}">
      <div class="side-stack">
        ${segmentHtml}
      </div>
      <span class="side-title">${hasLabel ? escapeHtml(label ?? '') : ''}</span>
    </div>
  `
}

function renderBlock(block: Block): string {
  const alignClass = getAlignClass(block.align)
  const fontClass = getFontClass(block.font)
  const sizeClass = getSizeClass('size' in block ? block.size : undefined)
  const sharedClass = `block ${alignClass} ${fontClass} ${sizeClass}`.trim()

  switch (block.type) {
    case 'heading':
      return `
        <h3 class="${sharedClass} heading ${
          block.variant ? `variant-${block.variant}` : ''
        }">
          ${escapeHtml(block.text)}
        </h3>
      `
    case 'text':
      return `
        <p class="${sharedClass} text">
          ${formatText(block.text)}
        </p>
      `
    case 'note':
      return `
        <p class="${sharedClass} note">
          ${formatText(block.text)}
        </p>
      `
    case 'image':
      return renderImageBlock(block, sharedClass)
    case 'toc':
      return renderTocBlock(block, sharedClass)
    case 'list':
      return renderListBlock(block, sharedClass)
    case 'hint':
      return renderHintBlock(block, sharedClass)
    case 'spacer':
      return `
        <div class="${sharedClass} spacer" style="height: ${block.sizeMm ?? 4}mm;"></div>
      `
    default: {
      const exhaustiveCheck: never = block
      return exhaustiveCheck
    }
  }
}

function renderImageBlock(block: ImageBlock, sharedClass: string): string {
  const ratio = block.ratio ?? '4 / 3'
  const caption = block.caption
    ? `<figcaption>${escapeHtml(block.caption)}</figcaption>`
    : ''
  const imgHtml = block.src
    ? `<img src="${block.src}" alt="${escapeHtml(block.alt ?? 'Hint image')}" />`
    : `<div class="image-placeholder">Image placeholder</div>`
  const frameClass = block.frame ? `frame-${block.frame}` : ''

  return `
    <figure class="${sharedClass} image ${frameClass}" style="--image-ratio: ${ratio};">
      ${imgHtml}
      ${caption}
    </figure>
  `
}

function renderTocBlock(block: TocBlock, sharedClass: string): string {
  const columns = block.columns ?? 2
  const leader = String.fromCharCode(0x30fb).repeat(3)
  const entries = block.entries
    .map((entry) => {
      const pageText = entry.pageText ?? (entry.page ? String(entry.page) : '')
      const labelHtml = entry.emphasis
        ? `<strong>${escapeHtml(entry.label)}</strong>`
        : escapeHtml(entry.label)
      return `
        <div class="toc-row">
          <span class="toc-page">${escapeHtml(pageText)}</span>
          <span class="toc-leader">${leader}</span>
          <span class="toc-label">${labelHtml}</span>
        </div>
      `
    })
    .join('')

  return `
    <div class="${sharedClass} toc" style="--toc-columns: ${columns};">
      ${entries}
    </div>
  `
}

function renderListBlock(block: ListBlock, sharedClass: string): string {
  const items = block.items
    .map(
      (item) => `
        <div class="list-row">
          <div class="list-label">${escapeHtml(item.label)}</div>
          <div class="list-text">${escapeHtml(item.text)}</div>
        </div>
      `,
    )
    .join('')

  return `
    <div class="${sharedClass} list">
      ${items}
    </div>
  `
}

function renderHintBlock(block: HintBlock, sharedClass: string): string {
  const markerStyle = block.markerColor ? `style="background:${block.markerColor}"` : ''
  const answer = block.answer
    ? `<p class="hint-answer">${formatText(block.answer)}</p>`
    : ''

  return `
    <div class="${sharedClass} hint" ${
      block.markerColor ? `style="--hint-marker:${block.markerColor}"` : ''
    }>
      <div class="hint-title">
        <span class="hint-marker" ${markerStyle}></span>
        <span class="hint-heading">${escapeHtml(block.title)}</span>
      </div>
      <p class="hint-body">${formatText(block.body)}</p>
      ${answer}
    </div>
  `
}

function getFontClass(font?: FontToken): string {
  switch (font) {
    case 'serif':
      return 'font-serif'
    case 'display':
      return 'font-display'
    case 'gothic':
    default:
      return 'font-gothic'
  }
}

function getAlignClass(align?: Align): string {
  switch (align) {
    case 'center':
      return 'align-center'
    case 'right':
      return 'align-right'
    case 'left':
    default:
      return 'align-left'
  }
}

function getSizeClass(size?: TextSize): string {
  switch (size) {
    case 'sm':
      return 'size-sm'
    case 'lg':
      return 'size-lg'
    case 'md':
    default:
      return 'size-md'
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case '&':
        return '&amp;'
      case '<':
        return '&lt;'
      case '>':
        return '&gt;'
      case '"':
        return '&quot;'
      case "'":
        return '&#39;'
      default:
        return char
    }
  })
}

function formatText(value: string): string {
  return escapeHtml(value).replace(/\n/g, '<br />')
}

function getSourceLabel(): string {
  const url = import.meta.env.VITE_BOOK_URL as string | undefined
  const source = (import.meta.env.VITE_BOOK_SOURCE as string | undefined) ?? 'sample'
  if (!url || source === 'sample') {
    return 'src/data/sampleBook.ts'
  }
  return url
}
