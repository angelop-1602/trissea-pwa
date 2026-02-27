# TRISSEA - Multi-Tenant Tricycle Booking PWA

A comprehensive Next.js application demonstrating a complete multi-tenant tricycle booking and TODA (Transportation Organization of Driver Association) queue management system with support for 4 user roles, simulated real-time updates, and tenant-specific branding.

## Features

### 🎯 Core Platform Features
- **Multi-tenant architecture** with region and province hierarchy
- **On-demand ride booking** with real-time driver matching
- **TODA queue system** for terminal-based ride management
- **Real-time ride tracking** with simulated driver locations
- **Simulated real-time updates** - rides automatically progress through statuses
- **Tenant branding customization** - logos and colors override per tenant
- **4 User Roles**: Passenger, Driver, Admin, Superadmin

### 🔄 Ride Status Flow
Rides automatically progress: `searching` → `matched` → `en-route` → `arrived` → `in-trip` → `completed`

### 🎨 Design System
- **Primary Color**: #14622e (Deep Green)
- **Accent Color**: #fecc04 (Yellow)
- CSS variable-based theming supporting tenant-level overrides
- Status-based color badges
- Responsive mobile-first design

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm (or npm/yarn)

### Installation

1. **Clone and install dependencies:**
```bash
cd /vercel/share/v0-project
pnpm install
```

2. **Run the development server:**
```bash
pnpm dev
```

3. **Open your browser:**
- Navigate to `http://localhost:3000`
- You'll be redirected to the login page

## User Roles & Navigation

### 🚗 Passenger Flow
**Access**: Sign in as a passenger  
**Pages**:
- `/passenger/home` - Dashboard with wallet, rating, and recent activity
- `/passenger/on-demand` - Book rides on-demand with real-time tracking
- `/passenger/todo` - Queue at TODA terminals
- `/passenger/history` - View ride history and statistics

**Features**:
- Wallet management
- Real-time ride status tracking
- Driver assignment and contact
- Queue reservations with position tracking

### 👨‍💼 Driver Flow
**Access**: Sign in as a driver  
**Pages**:
- `/driver/dashboard` - Dashboard with duty toggle and performance metrics
- `/driver/offers` - Incoming ride offers with countdown timers
- `/driver/active-trip` - Current trip tracking with passenger info
- `/driver/earnings` - Earnings breakdown and payment details
- `/driver/history` - Complete ride history and statistics

**Features**:
- Go online/offline duty toggle
- Ride offer acceptance with countdown
- Real-time trip tracking with passenger communication
- Earnings tracking and analytics

### 👨‍💻 Admin Flow
**Access**: Sign in as an admin  
**Pages**:
- `/admin/dashboard` - Platform overview for a specific tenant
- `/admin/terminals` - TODA terminal management
- `/admin/drivers` - Driver management and monitoring
- `/admin/rides` - Ride monitoring and management
- `/admin/reports` - Analytics and performance metrics
- `/admin/reservations` - Queue reservation management
- `/admin/users` - User management
- `/admin/settings` - Tenant configuration

**Features**:
- Tenant-specific dashboard
- Terminal capacity and queue monitoring
- Driver performance tracking
- Revenue and ride analytics
- Support management

### 🔑 Superadmin Flow
**Access**: Sign in as a superadmin  
**Pages**:
- `/superadmin/dashboard` - Platform-wide overview
- `/superadmin/regions` - Region management
- `/superadmin/tenants` - Tenant creation and management
- `/superadmin/branding` - Tenant branding customization
- `/superadmin/reports` - Platform-wide analytics
- `/superadmin/settings` - Global platform configuration

**Features**:
- Multi-region management
- Tenant lifecycle management
- Branding customization (logos, colors, feature flags)
- Platform-wide analytics
- Commission and feature configuration

## Developer Tools

### Switching Roles & Tenants

At the top of every authenticated page, you'll find two developer switchers:

#### 🏢 Tenant Switcher
- Located in the top right of the header
- Switch between different tenants (Makati, Taguig, Cebu)
- Observe real-time branding changes
- Each tenant has unique data, users, and drivers

#### 👥 Role Switcher
- Located next to the tenant switcher
- Switch between Passenger, Driver, Admin, and Superadmin roles
- View the same tenant from different perspectives
- Each role has unique permissions and dashboards

### How to Test Role Switching
1. Start the app and log in
2. Use the Role Switcher to select "Driver"
3. You'll see the driver dashboard with offers and earnings
4. Switch to "Admin" to see tenant management
5. Switch to "Superadmin" to see platform management
6. Return to "Passenger" to test the booking flow

### How to Test Tenant Branding
1. Use the Tenant Switcher to select different tenants
2. Navigate to pages to observe branding changes
3. Go to `/superadmin/branding` to customize colors and logos
4. Changes apply instantly across all pages

## Project Structure

```
app/
├── (marketing)/
│   └── page.tsx              # Landing page
├── login/
│   └── page.tsx              # Login with role/tenant selection
├── passenger/
│   ├── home/
│   ├── on-demand/
│   ├── todo/
│   └── history/
├── driver/
│   ├── dashboard/
│   ├── offers/
│   ├── active-trip/
│   ├── earnings/
│   └── history/
├── admin/
│   ├── dashboard/
│   ├── terminals/
│   ├── drivers/
│   ├── rides/
│   ├── reports/
│   ├── reservations/
│   ├── users/
│   └── settings/
├── superadmin/
│   ├── dashboard/
│   ├── regions/
│   ├── tenants/
│   ├── branding/
│   ├── reports/
│   └── settings/
├── layout.tsx                # Root layout with StoreProvider
└── globals.css               # Design system with CSS variables

components/
├── app-header.tsx            # Header with role/tenant switchers
├── bottom-nav.tsx            # Mobile bottom navigation
├── role-switcher.tsx         # Dev role switching dropdown
├── tenant-switcher.tsx       # Dev tenant switching dropdown
├── status-badge.tsx          # Ride/reservation status displays
├── ride-card.tsx             # Ride display component
├── map-view.tsx              # Simulated map view
├── region-header.tsx         # Expandable region header
├── empty-state.tsx           # Empty state display
├── data-table.tsx            # Reusable data table
└── sidebar-layout.tsx        # Admin/superadmin sidebar

lib/
├── mock-db.ts                # Simulated database with sample data
├── store-context.tsx         # Global state management with React Context
└── utils.ts                  # Utility functions (cn for classname merging)
```

## Simulated Real-Time Updates

The app includes a real-time simulation system without requiring a backend:

- **Automatic Status Progression**: Rides automatically advance through statuses every 3 seconds
- **Driver Location Updates**: Mock driver location changes simulate movement
- **Countdown Offers**: Driver offers have countdown timers that expire

You can observe these in:
- `/passenger/on-demand` - Watch ride status update
- `/driver/offers` - See countdown timers on offers
- `/driver/active-trip` - Watch driver location update

## Design System

### Colors
- **Primary (#14622e)**: Deep green - main brand color, buttons, active states
- **Accent (#fecc04)**: Yellow - highlights, accents, secondary actions
- **Neutrals**: White, grays, black - text, backgrounds, borders
- **Status Colors**: Blue (searching), Green (completed), Amber (warning), Red (cancelled)

### Typography
- **Font**: System fonts (sans-serif)
- **Heading Sizes**: h1 (2xl), h2 (lg), h3 (base)
- **Line Heights**: 1.4-1.6 for readability

### Components
- shadcn/ui components with custom theming
- Status badges for ride/reservation statuses
- Data tables for lists
- Modal dialogs for confirmations
- Sidebar layouts for admin dashboards

## Data Structure

### Mock Database
The app includes simulated data for:
- **2 Regions**: Metro Manila, Cebu
- **3 Tenants**: Makati, Taguig, Cebu City
- **4 Sample Users**: 1 Passenger, 1 Driver, 1 Admin, 1 Superadmin
- **2 TODA Terminals**: Makati Central, Taguig Market
- **Multiple Rides**: In various statuses for testing

All data is stored in `lib/mock-db.ts` and managed through React Context.

## Key Implementation Details

### Multi-Tenant Routing
All authenticated routes are organized by role:
- `/passenger/*` - Passenger-specific pages
- `/driver/*` - Driver-specific pages
- `/admin/*` - Admin-specific pages (same tenant)
- `/superadmin/*` - Superadmin-specific pages (all tenants)

### Context-Based State Management
- Global store using React Context + useState
- User, tenant, and region state
- Simulated data mutations
- No Redux or other external state management

### CSS Variables for Theming
- Root CSS variables: `--primary`, `--accent`, `--background`, etc.
- Tailwind CSS v4 with custom color tokens
- Tenant-specific overrides via CSS classes
- Dark mode support via `.dark` class

### Responsive Design
- Mobile-first approach
- Bottom navigation for passengers
- Sidebar for admin/superadmin
- Responsive grids and cards
- Touch-friendly buttons and inputs

## Customization

### Change Default Tenant
Edit `/lib/mock-db.ts` to modify default tenant assignments in the `useEffect` of StoreProvider.

### Add New Roles
1. Add role type to `UserRole` in `lib/mock-db.ts`
2. Create new role pages in `/app/[role-name]/`
3. Add navigation in role-switcher component

### Modify Colors
Edit CSS variables in `/app/globals.css` root section:
```css
:root {
  --primary: 146 55% 17%;      /* Hue Saturation Lightness */
  --accent: 45 100% 50%;
  /* ... other variables */
}
```

### Add Mock Data
Extend arrays in `/lib/mock-db.ts`:
```typescript
const users: User[] = [
  // Add more users here
];
```

## Deployment

### To Vercel
1. Push code to GitHub
2. Connect to Vercel
3. Deploy automatically

### Environment Variables
No environment variables required for demo mode. All data is simulated.

## Browser Support
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance Notes
- Simulated real-time updates run every 3 seconds
- No actual API calls or database queries
- Lightweight context-based state management
- Optimized for mobile-first experience

## Troubleshooting

### Role switcher not showing
- Ensure you're on an authenticated page
- Check that StoreProvider is wrapping your app in layout.tsx

### Tenants not loading
- Verify mock-db.ts has tenant data
- Check StoreProvider initialization

### Styles not applying
- Ensure globals.css is imported in layout.tsx
- Clear browser cache
- Rebuild with `pnpm build`

## Future Enhancements
- Real backend API integration
- Actual WebSocket real-time updates
- Authentication system
- Payment processing
- Push notifications
- Advanced analytics
- File uploads for logos
- Multi-language support

## License
MIT - Feel free to use for learning and development

## Support
For questions or issues, refer to the code comments or review the component documentation within each file.

---

**Made with ❤️ using Next.js 15, React 19, and shadcn/ui**
