# Sheets Layout

You can use either a single sheet (recommended for simple editing) or two sheets.

## Single-sheet mode (recommended)

Create a sheet named `book` (or `main`). Use these columns:
- `ord`
- `page_no`
- `step`
- `step_label` (optional)
- `body`
- `image`
- `page_tag`
- `side_segments` (optional)

### How it works
- Each row = one content row on a page.
- Rows with the same `page_no` belong to the same page.
- `step` controls the page title and the side labels.
- `page_tag` is for linking from the TOC.

### Body directives
- `#page tag:TAG label:LABEL` adds a TOC entry.
- `#img` inserts an image (uses the `image` column or the URL after `#img`).
- A line starting with `■` becomes a hint block title.

Example `body`:
```
#page tag:hint_1st_1 label:1st-1
#page tag:hint_1st_2 label:1st-2
```

Example `body` with hint:
```
■ 謎ID:001のヒント
イラストは上から「ないん」「そうきん」…
答えは「???」です。
```

### Step color (optional)
You can embed a color in the `step` value:
- `1st#cc4b5e`
- `2nd:2e71b3`
- `LAST,c59319`

If no color is provided, the script uses default colors.

### Step label layout (optional)
Add `step_label` to control how the side label is rendered for that step.
You can use line breaks in the cell and rich-text styling (font size, bold, etc).
If multiple rows use the same step, the first non-empty `step_label` is used.

### Side labels override (optional)
If you want to control which side labels appear on that page, add `side_segments`.
Format:
- `1st#cc4b5e|2nd#2e71b3|LAST#c59319`
Use `\\n` inside the label for manual line breaks (example: `1st\\n1`).

## Two-sheet mode (advanced)

Use two sheets named `pages` and `blocks`.

## pages sheet

Required headers (row 1):
- `page_no`
- `title`
- `header_color`
- `frame_color`
- `header_text_color`
- `side_segments`

Optional headers:
- `outer_label`
- `inner_label`

`side_segments` format (one cell):
- `1st#cc4b5e|2nd#2e71b3|3rd#3c8f45|LAST#c59319`

## blocks sheet

Required headers (row 1):
- `page_no`
- `order`
- `type`

Common optional headers:
- `text`
- `title`
- `body`
- `answer`
- `font` (gothic, serif, display)
- `size` (sm, md, lg)
- `align` (left, center, right)

Image fields:
- `image_url`
- `caption`
- `ratio` (example: `4 / 3`)
- `frame` (line, shadow)

List fields:
- `items`

`items` format (one per line):
- `Label :: Text`

Hint fields:
- `marker_color`

TOC fields (optional):
- `entries` (same format as items, but `Label :: Page :: Tag`)
- `columns`

Spacer fields:
- `size_mm`

## Block types

Supported `type` values:
- `heading`
- `text`
- `note`
- `image`
- `list`
- `hint`
- `toc`
- `spacer`
