frontend/
├── assets/
│   └── fonts/                          ← create this folder
│       ├── Inter-Regular.ttf            (download from Google Fonts)
│       └── Inter-Bold.ttf               (download from Google Fonts)
│
├── types/
│   └── tweet.ts                         ← new
│
├── components/
│   └── tweet/                           ← new folder
│       ├── exportCard.ts                ← new
│       ├── skia/                        ← new folder
│       │   ├── layout.ts                ← new
│       │   ├── icons.ts                 ← new
│       │   ├── Icon.tsx                 ← new
│       │   ├── fonts.ts                 ← new
│       │   ├── formatTime.ts            ← new
│       │   ├── paragraphs.ts            ← new
│       │   ├── Avatar.tsx               ← new
│       │   ├── AuthorRow.tsx            ← new
│       │   ├── TweetText.tsx            ← new
│       │   ├── ImageGrid.tsx            ← new
│       │   └── EngagementRow.tsx        ← new
│       └── templates/                   ← new folder
│           └── RegularCard.tsx          ← new
│
└── app/
    └── preview.tsx                      ← edit (already existed, empty)                         ← Colors, Spacing, Radius, FontSize