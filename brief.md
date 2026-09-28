# Project: Fehrist (Pakistan Event Directory)

## Role
You are an expert Full-Stack Developer and UI/UX Designer. You are building V1 of "Fehrist". Prioritize clean, readable code, simple architecture, and strict adherence to the design rules below. 

## Tech Stack (STRICT)
- Framework: Next.js (App Router)
- Styling: Tailwind CSS
- UI Components: shadcn/ui (Button, Card, Input, Badge, Table, Checkbox, DropdownMenu, Dialog, Tabs)
- Icons: lucide-react
- Database/Auth: Supabase (PostgreSQL)

## Design System Rules (CRITICAL - DO NOT IGNORE)
1. Mixed Corner Strategy: 
   - SHARP corners (`rounded-none` or `rounded-sm` max 2px) for: Main layout containers, data tables, search bars, primary buttons, cards, and form inputs. 
   - ROUNDED pills (`rounded-full`) ONLY for: Category filter pills (e.g., "Technology"), Status badges (e.g., "Registration Open"), and tags.
   - NEVER use `rounded-lg`, `rounded-xl`, or `rounded-2xl` on main structural elements.
2. Colors: 
   - Main background: light gray/white (`bg-slate-50` or `bg-white`). 
   - Headers/Navbars: dark slate (`bg-slate-900`). 
   - Announcement bar: light green background.
   - Status Badges: Green bg/text for "Registration Open", Orange for "Happening Today", Gray for "Upcoming".
3. Layout & Typography: 
   - Use thin, subtle gray borders (`border border-slate-200`) to separate sections, table rows, and sidebar items. 
   - Avoid heavy drop shadows. Keep it flat, clean, and data-dense (like Codeforces, GitHub, or Admin dashboards).
   - Font: Clean sans-serif (Inter or similar).

## Global UI Elements
- **Top Announcement Bar:** Light green bg. Text: "Announcement: DragonByte Coding Challenge 2026 - Final Round in 6 days. Details". Close button (X) on right.
- **Header:** Dark slate bg. Logo "Fehrist" on left. "Login" and Dark Mode toggle on right.
- **Footer:** Dark slate bg. Links: About, Submit Event, For Organizers, Contact, Privacy, Terms. 
- **Footer Copyright:** "© 2026 Fehrist · Pakistan's event discovery directory · All times PKT(UTC+5)"

## Core Pages
1. **Homepage:** Two-column layout. Left sidebar (Filters: Eligibility, Competition, Saved Events). Right side (Search, Category/Date pills, Data Table of events).
2. **Event Details:** Modal/Overlay showing Title, Organizer (Verified), Description, Tags, and Actions (Register Now, Save, Share, Report).
3. **Authentication:** Login, Signup, and Preferences (Select primary city) pages.
4. **Submit Event:** Form with 2-column grid for inputs. Success state shows "Pending Admin Approval" card.
5. **Admin Console:** Left sidebar navigation. Dashboard overview with Stats Cards, Pending Moderation Queue table, and Recent Activity.
6. **User Dashboard:** Tabs for My Submissions, Saved Events, and Settings (Primary city dropdown).
7. **For Organizers:** "Why Us" (3 columns), "How it works" (3 steps), and CTA button.
8. **Static Pages:** Privacy Policy and Terms of Service (clean typography).

## Database Schema (Keep it Flat for V1)
Table: `events`
- id (uuid, primary key)
- title (text)
- description (text)
- event_date (date)
- start_time (time)
- end_time (time)
- city (text)
- category (text)
- event_type (text)
- location_details (text)
- registration_url (text)
- organizer_name (text)
- is_verified (boolean, default false)
- status (text: 'pending', 'approved', 'completed', 'cancelled')
- submitted_by_user_id (uuid)

## V1 Constraints (What NOT to build)
- NO custom image uploading. Use placeholder colored boxes or Unsplash URLs for event posters.
- NO complex payment gateways. Registration is just an external URL.
- NO separate "Organizer" login. One unified user account.
- NO hard-deleting events. Past events just change status to 'completed'.
- Use MOCK DATA initially to populate the UI before connecting Supabase.