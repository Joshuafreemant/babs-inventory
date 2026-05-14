# PharmTrack - Mobile-First Pharmaceutical Sales Manager

A production-ready, mobile-responsive pharmaceutical sales management system built with Next.js 16, React 19, and Tailwind CSS v4. Includes full company operations tracking plus separate personal business management.

## Features

### Core Modules
- **Dashboard** - Overview of stock, revenue, unpaid amounts, and overdue payments
- **Inventory Management** - Track products, stock levels, and total inventory value
- **Direct Sales** - Record direct customer sales with payment tracking
- **Distributor Deals** - Manage distributor transactions with split upfront/balance payments
- **Institutional Sales** - Credit sales to institutions with due dates and overdue tracking
- **Personal Business** - Separate tracking for your personal pharmaceutical business (buy from company, sell to hospitals/pharmacies)

### Mobile-First Responsive Design
- **Hamburger navigation** on mobile (<768px) | **Full sidebar** on desktop (≥768px)
- **Responsive data layouts**: Card view on mobile, tables on desktop
- **Touch-friendly buttons** with 44px+ minimum tap targets
- **Adaptive grids**: 2 columns mobile → 4 columns desktop
- **Full-height modals** on mobile, centered on desktop

## Project Structure

```
├── app/
│   ├── page.tsx           # Home page entry
│   ├── layout.tsx         # Root layout with metadata
│   └── globals.css        # Global styles & Tailwind config
├── components/
│   ├── AppContainer.tsx   # Main state management & routing
│   ├── shared/            # Reusable UI components
│   │   ├── Badge.tsx
│   │   ├── Card.tsx       # Includes StatCard
│   │   ├── Modal.tsx
│   │   └── Sidebar.tsx    # Mobile hamburger + desktop sidebar
│   └── pages/             # Feature-specific page components
│       ├── Dashboard.tsx
│       ├── Inventory.tsx
│       ├── DirectSales.tsx
│       ├── DistributorDeals.tsx
│       ├── Institutional.tsx
│       └── PersonalBusiness.tsx
├── lib/
│   ├── types.ts           # TypeScript type definitions
│   └── constants.ts       # Initial data, nav items, helpers
└── package.json           # Dependencies
```

## Getting Started

### Installation

```bash
# Extract the ZIP file
# Navigate to the project directory

# Install dependencies
npm install
# or
pnpm install
# or
yarn install

# Start development server
npm run dev
```

The app will be available at **http://localhost:3000**

### Mobile Testing

Test responsiveness by:
- Resizing your browser window
- Opening DevTools (F12) and enabling device emulation
- Testing on actual mobile devices at your local network IP

## Technology Stack

- **Framework**: Next.js 16 with App Router
- **UI Library**: React 19
- **Styling**: Tailwind CSS v4
- **Icons**: Tabler Icons
- **State Management**: React hooks (useState)
- **Development**: Turbopack, TypeScript

## Responsive Breakpoints

All components follow Tailwind's breakpoint system:
- **Mobile**: Default (0-767px)
- **Tablet & Desktop**: `md:` (768px and up)

Example patterns:
```jsx
// 2 columns mobile, 4 desktop
<div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">

// Card on mobile, table on desktop
<div className="md:hidden">Cards...</div>
<div className="hidden md:overflow-x-auto">Table...</div>

// Responsive padding
<div className="p-3 md:p-6">
```

## Core Features

### Dashboard
- Key metrics: Total Stock, Revenue, Unpaid Amount, Overdue Count
- Recent sales (card view mobile, table desktop)
- Overdue payment alerts

### Inventory
- View all products with prices and stock
- Add new products
- Restock with modal
- Color-coded stock warnings

### Direct Sales
- Record customer sales
- Mark payments as paid/pending
- Track pending amounts
- View transaction history

### Distributor Deals
- Create split-payment deals
- Track upfront & balance separately
- Monitor pending collections
- Color-coded payment status

### Institutional Sales
- Credit sales with due dates
- Automatic overdue detection
- Track paid/unpaid status
- Overdue alerts on dashboard

### Personal Business (NEW)
**Completely separate from company data:**
- **Purchases**: Buy products from company at cost price
- **Sales**: Sell to hospitals/pharmacies with automatic 15% markup
- **Metrics**: Track investment, revenue, profit, and collected payments
- **Payment Tracking**: Monitor which sales are paid/pending
- **Data Isolation**: Personal business never mixes with company operations

## Initial Sample Data

The app includes demo data:
- 5 products with prices and stock levels
- 2 direct sales transactions
- 2 distributor deals
- 3 institutional sales
- 2 personal purchases
- 2 personal sales

**Note**: Data resets on page reload. For production, integrate with a database.

## Customization

### Change Initial Data
Edit arrays in `lib/constants.ts`:
```typescript
export const initialProducts: Product[] = [...]
export const initialDirectSales: DirectSale[] = [...]
export const initialPersonalPurchases: PersonalPurchase[] = [...]
// etc.
```

### Add New Features
1. Define types in `lib/types.ts`
2. Create page component in `components/pages/`
3. Add state to `AppContainer.tsx`
4. Update nav in `lib/constants.ts`

### Styling
Update colors in `app/globals.css`:
```css
:root {
  --primary: oklch(...);
  --secondary: oklch(...);
}
```

## Browser Support

- Chrome/Chromium 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance

- **Turbopack**: Ultra-fast builds and HMR
- **Code splitting**: Each page loads separately
- **Responsive icons**: Scale for all screen sizes
- **Minimal dependencies**: Clean, lightweight codebase

## Deployment

### Deploy to Vercel
```bash
npm i -g vercel
vercel
```

### Other Platforms
```bash
npm run build
# Deploy the `.next` folder
```

## Troubleshooting

**Port 3000 in use?**
```bash
PORT=3001 npm run dev
```

**Styles not loading?**
```bash
rm -rf .next
npm run dev
```

**Icons missing?**
Ensure this is in `app/globals.css`:
```css
@import url('https://cdn.jsdelivr.net/npm/@tabler/icons@latest/tabler-icons.min.css');
```

---

Built with v0.app - Vercel's AI assistant for web applications.
