# PharmTrack - Quick Start Guide

## Download & Setup (2 minutes)

### 1. Extract & Install
```bash
# Extract the ZIP file
cd /path/to/pharmtrack

# Install dependencies
npm install
# OR
pnpm install
```

### 2. Run the App
```bash
npm run dev
```

App opens at **http://localhost:3000** 🎉

## What You Get

✅ **Mobile-first responsive app** - Works on phones, tablets, desktop  
✅ **6 complete modules** - Dashboard, Inventory, Sales, Distributor, Institutional, Personal Business  
✅ **Zero backend needed** - Runs completely offline  
✅ **Sample data included** - Pre-populated demo data  
✅ **Production ready** - Can deploy to Vercel, AWS, etc.  

## Test It Out

### Mobile Testing
1. Press **F12** (DevTools)
2. Click **device icon** 📱
3. Select **iPhone 12** or **iPad**
4. Watch the UI adapt!

### Try Each Feature
1. **Dashboard** - See overview and metrics
2. **Inventory** - Add products, restock items
3. **Direct Sales** - Record customer sales
4. **Distributor** - Create split-payment deals
5. **Institutional** - Track credit sales with due dates
6. **Personal Business** - Your personal sales side business

## Key Features

### For Mobile 📱
- Hamburger menu at top
- Card-based data view
- Full-screen modals
- Touch-friendly buttons
- Single column layouts

### For Desktop 💻
- Persistent sidebar
- Data tables
- Centered modals
- Multi-column grids
- Rich information display

### Personal Business 🎯
A **completely separate** section to track your own pharmaceutical business:
- Buy from company at cost
- Sell to hospitals/pharmacies
- Track profit/loss independently
- Monitor which sales are paid
- **Never mixes** with company data

## Customization (5 minutes)

### Change Sample Data
Edit `lib/constants.ts`:
```typescript
export const initialProducts = [
  { id: 1, name: "Your Product", price: 5000, stock: 100 },
  // Add more...
]
```

### Add Your Products
Replace the sample products with your actual inventory.

### Change Colors
Edit `app/globals.css`:
```css
:root {
  --primary: oklch(...);
  --secondary: oklch(...);
}
```

## Before Going Live

### If Using as Template
1. Replace sample data with real data
2. Add backend database (Firebase, Supabase, etc.)
3. Add user authentication
4. Remove demo products
5. Test on actual mobile devices
6. Deploy to Vercel or your server

### Database Integration
```typescript
// Currently all data is in React state
// To persist data, connect to:
// - Supabase (recommended)
// - Firebase
// - Custom Node.js backend
// - AWS DynamoDB
```

## Deployment (2 minutes)

### To Vercel (Easiest)
```bash
npm i -g vercel
vercel
```

### To Any Server
```bash
npm run build
# Copy the .next folder to your server
# Run: npm run start
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Port 3000 in use | `PORT=3001 npm run dev` |
| Styles broken | `rm -rf .next && npm run dev` |
| Icons not showing | Check Tabler import in globals.css |
| Data lost on refresh | Expected - data is in-memory (integrate DB) |

## File Structure Quick Tour

```
📦 Your App
├── 📄 README.md ..................... Full documentation
├── 📄 CHANGELOG.md .................. What changed
├── 📄 MOBILE_RESPONSIVE.md ......... Mobile design details
│
├── 📁 lib/
│   ├── types.ts .................... Type definitions
│   └── constants.ts ................ Data & helpers
│
├── 📁 components/
│   ├── AppContainer.tsx ............ Main app logic
│   ├── 📁 shared/
│   │   ├── Badge.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   └── Sidebar.tsx
│   └── 📁 pages/
│       ├── Dashboard.tsx
│       ├── Inventory.tsx
│       ├── DirectSales.tsx
│       ├── DistributorDeals.tsx
│       ├── Institutional.tsx
│       └── PersonalBusiness.tsx
│
└── 📁 app/
    ├── page.tsx .................... Home page
    ├── layout.tsx .................. Root layout
    └── globals.css ................. Styles
```

## Next Steps

1. **Explore the app** - Navigate through each module
2. **Test on mobile** - Use DevTools to test responsiveness
3. **Modify sample data** - Add your products and data
4. **Read documentation** - Check README.md for detailed info
5. **Deploy** - Push to Vercel when ready
6. **Add database** - Integrate backend for data persistence

## Need Help?

📖 Read full docs: `README.md`  
📱 Mobile design guide: `MOBILE_RESPONSIVE.md`  
📝 What changed: `CHANGELOG.md`  

---

**You're all set! Start the app and explore.** 🚀
