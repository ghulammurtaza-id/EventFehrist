# FEHRIST — PROJECT BIBLE & SYSTEM ARCHITECTURE
> **Single Source of Truth for Design System, Engineering Standards, and Roadmap**
> *Created for developers, designers, and AI coding agents to preserve context and ensure zero regressions.*

---

## 1. Project Vision & Mission

### What is Fehrist?
**Fehrist** (فہرست — meaning *catalog* or *directory* in Urdu) is Pakistan's first centralized, open-source event discovery directory. 

### The Problem It Solves
1. **The Social Media Void:** Hackathons, developer meetups, academic workshops, conferences, and student competitions in Pakistan are scattered across disparate WhatsApp groups, LinkedIn posts, Instagram stories, and Facebook events. Students and professionals constantly miss out because opportunities get buried by algorithms.
2. **High Friction for Organizers:** Traditional event listing platforms either charge ticketing cuts, impose mandatory payment gateways, or enforce bloated registration workflows.
3. **Spam & Trust Issues:** Social media is riddled with unverified announcements, fake competitions, and spam. Fehrist provides a curated, verified directory where attendees can trust what they see and organizers can target attendees by city, mode, and category.

### Core Philosophy
- **Discovery First:** We are a discovery engine, not a ticketing gate. Organizers keep their own registration links (Google Forms, Eventbrite, website forms, etc.). Listing is 100% free with no hidden fees.
- **Speed & Utility:** Fast, lightweight, dense table UI reminiscent of classic, high-efficiency directories (Craigslist, Hacker News, Wikipedia) infused with modern, clean typography and subtle micro-interactions.

---

## 2. Tech Stack

| Technology | Purpose | Notes |
| :--- | :--- | :--- |
| **Next.js 16 (App Router + Turbopack)** | Fullstack React Framework | SSR, Static Site Generation (SSG), fast routing |
| **React 19** | Component Architecture | Concurrent features, modern hooks |
| **TypeScript 5** | Strict Type Safety | Strict typing across event models, filters, props |
| **Tailwind CSS v4** | Modern Utility Styling | CSS-first config via `@import "tailwindcss"` |
| **Lucide React** | Icons | Minimal, consistent stroke-based iconography |
| **Next Font (Google)** | Typography | `Inter` and `Open Sans` with `display: swap` |

---

## 3. Strict Design System & UI/UX Rules
> ⚠️ **CRITICAL DIRECTIVE FOR ALL FUTURE CODE & AI AGENTS:**
> Never alter these rules without explicit user request. Do not introduce ad-hoc rounding, gradients, or non-system colors.

### 3.1 Typography
1. **Headings (`h1`, `h2`, `h3`):**
   - Font Family: **Open Sans**
   - Font Weight: Strictly **`font-bold`** (`weight: 700`)
   - Responsive Scale:
     - `h1`: `text-2xl md:text-4xl font-bold text-slate-900 mb-4`
     - `h2`: `text-lg md:text-2xl font-bold text-slate-900 mt-8 mb-3`
     - `h3`: `text-base md:text-lg font-bold text-slate-900 mb-2`
2. **Body Text & Paragraphs (`p`, `li`, `span`):**
   - Font Family: **Open Sans** (or `Inter` in primary dashboard tables/modals)
   - Font Weight: Strictly **`font-normal`** (`weight: 400`)
   - Scale: `text-sm md:text-base text-slate-600 leading-relaxed mb-6`
3. **Modals (`EventDetailsModal`):**
   - Entire modal content uses **`Inter`** with medium weighting (`font-medium`).
   - Category tag exception: Category tags (e.g. *AI*, *Web3*) use **`font-serif` / Times New Roman** for editorial contrast.

### 3.2 Curated Color Palette
- **Brand Blue:** `#186BA7` (Used for links, active category tabs, interactive accents)
  - Hover: `hover:underline` or `hover:opacity-80`
- **Header Dark:** `#292929` (Navbar background with border `#3a3a3a`)
- **Success / Verified Green:** `#065F46` / `#10B981` (Status badges)
- **Base Background:** `#FFFFFF` (Pure white for cards/table; light gray `#F8FAFC` for background accents)
- **Table Hover Background:** `#EAEAEA` (Exact hex)
- **Table Two-Tone Grid Left Column:** `bg-slate-50` with border `border-slate-200`
- **Border Grays:** `border-slate-200`, `border-slate-300`, `border-gray-300`

### 3.3 Shapes & Geometry
- **Sharp Corners Everywhere:** 
  - Standard buttons, inputs, dropdowns, table rows, cards use **`rounded-none`** or **`rounded-sm`** (`2px` radius max).
  - ❌ **STRICTLY FORBIDDEN:** Do **NOT** use `rounded-lg`, `rounded-xl`, `rounded-2xl`, or `rounded-full` on standard interactive components.

### 3.4 Buttons & Interactive Elements
- **Standard Button Style (Filter, Reset, Tasks, Modal Actions, CTA):**
  ```html
  px-4 py-2 text-sm font-semibold border border-gray-300 bg-gray-100 text-slate-900 hover:bg-gray-200 hover:border-gray-400 active:bg-gray-300 active:scale-[0.98] transition-all duration-150 ease-in-out rounded-none cursor-pointer
  ```
- **Uniformity Rule:** In modals, all bottom buttons (*Register Now*, *Save*, *Share*, *Report*) must use this exact uniform light gray appearance. *Register Now* must **never** be solid black.

### 3.5 Table Row Hover Rule
- On hover over any event row in `EventsTable`:
  - Background turns strictly to **`#EAEAEA`** (`hover:bg-[#EAEAEA]`).
  - **Text color must NEVER change** on row hover. No `hover:text-*` or `group-hover:text-*`.

### 3.6 Dark Mode Policy
- **Disabled for V1:** Dark mode classes may exist as utilities, but the app defaults strictly to a pristine Light Mode experience. All designs must prioritize high-contrast light mode legibility first.

---

## 4. Component Status & Architecture

```
d:\fehrist\
├── src\
│   ├── app\
│   │   ├── about\page.tsx            # About page (Open source, lead dev, stack, contact)
│   │   ├── for-organizers\page.tsx   # For Organizers pitch, 3-column card grid, CTA
│   │   ├── organizers\page.tsx       # Re-exports /for-organizers for seamless URLs
│   │   ├── privacy\page.tsx          # Privacy Policy (No spam guarantee, rights)
│   │   ├── terms\page.tsx            # Terms of Service (Directory rules, moderation)
│   │   ├── globals.css               # Global Tailwind directives & resets
│   │   ├── layout.tsx                # Root layout with Inter font provider
│   │   └── page.tsx                  # Core dashboard (Search, filters, table, modal)
│   └── components\
│       ├── AnnouncementBar.tsx       # Top dismissible broadcast banner
│       ├── CityCombobox.tsx          # Fast 12-city dropdown + 127 Pakistani cities modal
│       ├── EventDetailsModal.tsx     # Two-tone data grid, sharp uniform buttons
│       ├── EventsTable.tsx           # Dense responsive data table with sticky headers
│       ├── Footer.tsx                # Global footer with Next.js <Link> routing
│       ├── Navbar.tsx                # Dark #292929 topbar with logo & Login link
│       └── Sidebar.tsx               # Left desktop drawer (Eligibility, Competition, Bookmarks)
```

### Component Breakdown
1. **`Navbar.tsx`**
   - Background `#292929`, border `#3a3a3a`.
   - Brand logo links cleanly to `"/"`.
   - Right side features "Login" link (`/login`).
2. **`Footer.tsx`**
   - Uses Next.js `<Link>` for client-side routing.
   - Clean nav link order: **Home** (`/`), **Submit Event** (`/submit`), **For Organizers** (`/for-organizers`), **About** (`/about`), **Privacy** (`/privacy`), **Terms** (`/terms`).
   - Links styled with `text-sm font-semibold underline text-[#186BA7]`.
3. **`CityCombobox.tsx`**
   - Quick-access popover featuring Pakistan's top 12 major cities (Karachi, Lahore, Islamabad, Rawalpindi, Faisalabad, Peshawar, Multan, Quetta, Sialkot, Gujranwala, Hyderabad, Abbottabad).
   - "All Cities" reset option.
   - Comprehensive searchable modal containing 127 Pakistani cities.
4. **`EventsTable.tsx`**
   - Displays event name, organizer, category, location, date, time, and eligibility.
   - Mobile responsive: hides minor columns (`#`, `City`, `Type`) on smaller viewports and enables smooth horizontal scroll without breaking layout.
   - Hover behavior enforces `#EAEAEA` background with frozen text color.
5. **`EventDetailsModal.tsx`**
   - Two-Tone Table: Label cells on left (`bg-slate-50 border-r border-slate-200 font-medium text-slate-600`), value cells on right (`bg-white text-slate-900`).
   - Four uniform action buttons at bottom: *Register Now*, *Save*, *Share*, *Report*.
   - Dismisses on backdrop click or top-right X button.
6. **Static Pages (`/about`, `/for-organizers`, `/privacy`, `/terms`)**
   - All use shared `Navbar` and `Footer`.
   - Responsive container `max-w-3xl` (or `max-w-4xl` on `/for-organizers` for the 3-column grid) with `px-4 md:px-6 py-8 md:py-12`.
   - Typography strictly follows H1/H2/P scale.

---

## 5. The Path Forward (Engineering Roadmap)

### Phase 1: Filter & Search Engine Integration
- [ ] Connect `Sidebar.tsx` checkboxes (Eligibility: *Students only*, *University*, *Open to all*; Competition: *Beginner friendly*, *Prizes*, *Certificates*) to `src/app/page.tsx` state.
- [ ] Connect keyword search input and mode select dropdown (*Any Mode*, *Physical*, *Online*, *Hybrid*) to table filtering.
- [ ] Sync active filter count and URL search params (`?city=lahore&category=hackathon`) for shareable filtered views.

### Phase 2: "Submit Event" Workflow
- [ ] Build `src/app/submit/page.tsx`.
- [ ] Implement multi-step or streamlined form:
  - Event Name, Description, Organizer Name.
  - Category, Mode (Online / Physical / Hybrid), Venue / Address, City.
  - Start Date, End Date, Time.
  - Registration URL (external link), Eligibility tags, Prize information.
- [ ] Client-side validation with clean error states following the sharp design system.

### Phase 3: Bookmarking & Community Reporting
- [ ] Implement LocalStorage-backed bookmarking ("Saved Events" count in `Sidebar.tsx`).
- [ ] Build a lightweight "Report Event" modal (Options: *Cancelled*, *Wrong Date/Time*, *Broken Link*, *Spam*).
- [ ] Toast notification system for user actions (*Event Saved*, *Link Copied*, *Report Submitted*).

### Phase 4: Backend & Authentication
- [ ] Integrate database (Supabase / PostgreSQL) for live event data storage.
- [ ] Admin dashboard for approving, rejecting, or verifying submitted events.
- [ ] "Verified Organizer" badge logic and organizer authentication.

---

## 6. Guidelines for AI Assistants & Contributors
1. **Always read this document** before implementing new features or making UI changes.
2. **Never change existing component contracts** without verifying consumer imports.
3. **Always run `npm run build`** after non-trivial modifications to guarantee zero TypeScript or Next.js build errors.
4. **Preserve exact color codes and sharp-corner geometry** on every new screen.
