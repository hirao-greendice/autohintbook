export type FontToken = 'gothic' | 'serif' | 'display'
export type Align = 'left' | 'center' | 'right'
export type TextSize = 'sm' | 'md' | 'lg'
export type HeadingVariant = 'label' | 'line'

export interface PageTheme {
  headerColor?: string
  frameColor?: string
  outerColor?: string
  innerColor?: string
  headerTextColor?: string
}

export interface PageData {
  pageNo: number
  title: string
  outerLabel?: string
  innerLabel?: string
  sideSegments?: PageSideSegment[]
  theme?: PageTheme
  blocks: Block[]
}

export interface PageSideSegment {
  label: string
  labelHtml?: string
  color: string
}

export interface BookMeta {
  title: string
  version: string
  pageSize: 'A5'
  updated: string
}

export interface BookData {
  meta: BookMeta
  pages: PageData[]
}

export type BlockType =
  | 'heading'
  | 'text'
  | 'note'
  | 'image'
  | 'toc'
  | 'list'
  | 'hint'
  | 'spacer'

export interface BlockBase {
  id: string
  type: BlockType
  font?: FontToken
  align?: Align
}

export interface HeadingBlock extends BlockBase {
  type: 'heading'
  text: string
  size?: TextSize
  variant?: HeadingVariant
}

export interface TextBlock extends BlockBase {
  type: 'text'
  text: string
  textHtml?: string
  size?: TextSize
}

export interface NoteBlock extends BlockBase {
  type: 'note'
  text: string
  textHtml?: string
  size?: TextSize
}

export interface ListItem {
  label: string
  text: string
}

export interface ListBlock extends BlockBase {
  type: 'list'
  items: ListItem[]
}

export interface HintBlock extends BlockBase {
  type: 'hint'
  title: string
  body: string
  bodyHtml?: string
  answer?: string
  answerHtml?: string
  markerColor?: string
}

export interface ImageBlock extends BlockBase {
  type: 'image'
  src?: string
  alt?: string
  caption?: string
  ratio?: string
  frame?: 'line' | 'shadow'
}

export interface TocEntry {
  label: string
  page?: number
  pageText?: string
  tag?: string
  emphasis?: boolean
}

export interface TocBlock extends BlockBase {
  type: 'toc'
  entries: TocEntry[]
  columns?: number
}

export interface SpacerBlock extends BlockBase {
  type: 'spacer'
  sizeMm?: number
}

export type Block =
  | HeadingBlock
  | TextBlock
  | NoteBlock
  | ImageBlock
  | TocBlock
  | ListBlock
  | HintBlock
  | SpacerBlock
