# Niti Pharma - Pharmacy Distributor Demo Website

A polished, elegant demo website for a B2B pharmacy distributor built with Next.js 14, TypeScript, and Tailwind CSS.

## Features

- **Product Catalog**: Browse 30+ pharmaceutical products with advanced search, filtering, and sorting
- **Product Details**: Comprehensive product information pages with attributes, documentation links, and substitutes
- **Coverage Map**: Interactive coverage visualization and detailed state/city service information
- **Compliance Information**: DSCSA compliance details, licensing, returns/recalls, and 340B program support
- **Contact Form**: Validated contact form with console logging (demo mode)
- **Dark Mode**: Full dark mode support with system preference detection
- **Responsive Design**: Mobile-first, fully responsive across all devices
- **Accessibility**: WCAG compliant with keyboard navigation and screen reader support
- **Performance**: Optimized for fast load times and smooth interactions

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Forms**: React Hook Form + Zod validation
- **Tables**: TanStack Table (client-side)
- **Theme**: next-themes

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm

### Installation

1. Install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

2. Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── catalog/           # Product catalog page
│   ├── product/[slug]/    # Product detail pages
│   ├── coverage/          # Coverage map and table
│   ├── compliance/        # Compliance information
│   ├── contact/           # Contact form page
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Landing page
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── site-header.tsx   # Site navigation header
│   ├── site-footer.tsx   # Site footer
│   ├── hero.tsx          # Landing page hero
│   ├── product-card.tsx  # Product card component
│   └── ...               # Other components
├── data/                 # Static JSON data
│   ├── products.json     # Product catalog (30 items)
│   ├── coverage.json     # Coverage data
│   └── docs.json         # Product documentation links
├── lib/                  # Utility functions
│   ├── data.ts          # Data access helpers
│   ├── filters.ts       # Filtering and sorting logic
│   ├── storage.ts       # localStorage utilities
│   └── utils.ts         # General utilities
└── public/              # Static assets
```

## Key Features Explained

### Catalog Page

- **Search**: Real-time search across product name, NDC, and manufacturer
- **Filters**: 
  - Manufacturer (multi-select)
  - Category/Therapeutic class
  - Schedule (OTC/Rx/Schedule H)
  - Cold-chain requirement
  - Stock availability
- **Sorting**: Relevance, Name, Price, Availability
- **View Modes**: Toggle between grid and table views (persisted in localStorage)

### Product Detail Page

- Complete product information
- Schedule and cold-chain badges
- Stock availability indicator
- Product attributes table
- Documentation links (SDS, Label)
- Eligible substitutes section

### Coverage Page

- Simplified SVG map representation
- Detailed coverage table with states, cities, and service days
- Responsive design

### Compliance Page

- DSCSA overview (TI/TS/TH)
- Returns and recalls information
- Licensing and certifications
- 340B program support details

### Contact Form

- Full form validation with Zod
- Required fields: Name, Email, Phone, Pharmacy Name, City, State, Message
- Optional: GSTIN
- Console logging on submit (demo mode)
- Success toast notification

## Data

All data is stored in static JSON files in the `/data` directory:

- `products.json`: 30 synthetic pharmaceutical products
- `coverage.json`: 15 states with cities and service days
- `docs.json`: Product documentation URLs (placeholder links)

## Styling

The project uses Tailwind CSS with custom design tokens:

- **Colors**: Slate/stone backgrounds, emerald accent
- **Typography**: Inter font (system fallback)
- **Components**: Rounded-2xl, soft shadows, hover states
- **Dark Mode**: Full support with CSS variables

## Accessibility

- Semantic HTML
- ARIA labels for icons and interactive elements
- Keyboard navigation support
- Focus visible indicators
- Screen reader friendly
- Reduced motion support

## Performance

- Client-side filtering and search (instant results)
- Image optimization with Next.js Image component
- Code splitting with Next.js App Router
- Optimized bundle size

## Deployment

This project is ready to deploy on Vercel:

1. Push your code to GitHub
2. Import the project in Vercel
3. Deploy automatically

Or deploy manually:

```bash
npm run build
npm start
```

## Demo Notes

- **No Backend**: All data is static JSON files
- **No Authentication**: No user accounts or login
- **No Payments**: No cart, checkout, or payment processing
- **No ERP Integration**: Purely read-only browsing
- **Contact Form**: Logs to console only (no actual submission)

## License

This is a demo project for portfolio purposes.

## Support

For questions or issues, please open an issue on the repository.

