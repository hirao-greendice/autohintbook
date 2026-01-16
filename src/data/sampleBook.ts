import type { BookData } from './types'

export const sampleBook: BookData = {
  meta: {
    title: 'Hintbook Prototype',
    version: '0.1.0',
    pageSize: 'A5',
    updated: '2026-01-16',
  },
  pages: [
    {
      pageNo: 1,
      title: '全体目次',
      sideSegments: [
        { label: '1st', color: '#c84a5a' },
        { label: '2nd', color: '#2e71b3' },
        { label: '3rd', color: '#3c8f45' },
        { label: 'LAST', color: '#c59319' },
      ],
      theme: {
        headerColor: '#5a5a5a',
        frameColor: '#6d6d6d',
        headerTextColor: '#ffffff',
      },
      blocks: [
        {
          id: 'toc-space',
          type: 'spacer',
          sizeMm: 12,
        },
        {
          id: 'toc-list',
          type: 'list',
          items: [
            { label: '1st STEP', text: '赤のページへ' },
            { label: '2nd STEP', text: '青のページへ' },
            { label: '3rd STEP', text: '緑のページへ' },
            { label: 'LAST STEP', text: '黄のページへ' },
          ],
          font: 'gothic',
        },
      ],
    },
    {
      pageNo: 2,
      title: '1st-1',
      sideSegments: [
        { label: '1st', color: '#cc4b5e' },
        { label: '1-1', color: '#b24753' },
        { label: '', color: '#7a7a7a' },
        { label: '', color: '#7a7a7a' },
        { label: '', color: '#7a7a7a' },
      ],
      theme: {
        headerColor: '#cc4b5e',
        frameColor: '#cc4b5e',
        headerTextColor: '#ffffff',
      },
      blocks: [
        {
          id: 'hint-001',
          type: 'hint',
          title: '謎ID:001のヒント',
          body:
            'イラストは上から「ないん」「そうきん」「こんぺいとう」を表しています。それぞれの矢印が通る位置にひらがなを1文字ずつ当てはめましょう。\n答えは「???」が表す3文字です。',
          markerColor: '#cc4b5e',
          font: 'gothic',
        },
        {
          id: 'hint-002',
          type: 'hint',
          title: '謎ID:002のヒント',
          body:
            '枠の中にあるものを右側の盤面に埋めましょう。一番奥に見えるカードは「ジャック」ではなく「ジョーカー」です。',
          markerColor: '#cc4b5e',
          font: 'gothic',
        },
        {
          id: 'hint-003',
          type: 'hint',
          title: '謎ID:003のヒント',
          body:
            '下のイラストは「ミズ」「ランタン」を表しています。左の例のように矢印を通って「ミズ」になることを逆算的に考えると、①=ス、②=ミとなりそうです。',
          markerColor: '#cc4b5e',
          font: 'gothic',
        },
        {
          id: 'hint-004',
          type: 'hint',
          title: '謎ID:004のヒント',
          body:
            '「カードを裏返すと逆になる」とは、カードをすべて裏返したときに、そのイラストに関連する対義語になるということを意味しています。',
          markerColor: '#cc4b5e',
          font: 'gothic',
        },
      ],
    },
    {
      pageNo: 4,
      title: 'LAST',
      sideSegments: [
        { label: '1st', color: '#c84a5a' },
        { label: '2nd', color: '#2e71b3' },
        { label: '3rd', color: '#3c8f45' },
        { label: 'LAST', color: '#c59319' },
      ],
      theme: {
        headerColor: '#c59319',
        frameColor: '#c59319',
        headerTextColor: '#ffffff',
      },
      blocks: [
        {
          id: 'last-body',
          type: 'text',
          text:
            '第三の試練の問題では、\n「人間会場にあって、アンドロイド会場にないもの」を探していました。\n\nアンドロイドの部屋は真空であることを踏まえると、\n「このマス全体に空気がない」はずです。',
          font: 'gothic',
        },
        {
          id: 'last-image',
          type: 'image',
          caption: 'アンドロイド会場 / 人間会場',
          ratio: '2 / 1',
          frame: 'line',
        },
        {
          id: 'last-footer',
          type: 'text',
          text:
            'つまり、アンドロイドが提出したのは「歩」ではなく、\n「王」となります。\n4枚のカードを使って「王」または「KING」を示しましょう。',
          font: 'gothic',
        },
      ],
    },
    {
      pageNo: 42,
      title: '2nd-4',
      sideSegments: [
        { label: '1st', color: '#b45c66' },
        { label: '2nd', color: '#2e71b3' },
        { label: '2-4', color: '#2b5a91' },
        { label: '', color: '#7a7a7a' },
        { label: '', color: '#7a7a7a' },
      ],
      theme: {
        headerColor: '#2e71b3',
        frameColor: '#2e71b3',
        headerTextColor: '#ffffff',
      },
      blocks: [
        {
          id: 'answer-005',
          type: 'hint',
          title: '謎ID:005の答え',
          body:
            '5つのイラストが表す言葉を埋めましょう。\n右端には何もないように見えますが、これは透明のイラストと解釈しましょう。',
          answer: '答えは「クウキセキ」です。',
          markerColor: '#2e71b3',
          font: 'gothic',
        },
        {
          id: 'answer-006',
          type: 'hint',
          title: '謎ID:006の答え',
          body:
            '「ふんすい」の文字を縦で通るためには、問題文の最後の「ケ」を使う必要があります。',
          answer: '答えは「チーズケーキ」です。',
          markerColor: '#2e71b3',
          font: 'gothic',
        },
        {
          id: 'answer-007',
          type: 'hint',
          title: '謎ID:007の答え',
          body:
            '「きょうかい」を繰り返し言う（きょうかいきょうかい…）ことで、「う」の間に「かいきょ」という言葉ができます。',
          answer: '答えは「スキャン」です。',
          markerColor: '#2e71b3',
          font: 'gothic',
        },
        {
          id: 'answer-008',
          type: 'hint',
          title: '謎ID:008の答え',
          body:
            '「トライアングル」「サークル」「スクエア」「スター」を左の盤面に埋めて1〜4のマスに当てはまる文字を読みましょう。',
          answer: '答えは「タイサクゴ」です。',
          markerColor: '#2e71b3',
          font: 'gothic',
        },
      ],
    },
  ],
}
