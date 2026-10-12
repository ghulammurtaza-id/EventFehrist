# Deep-Dive Backend Analysis: Event Statuses & Review Notes

**Project:** Fehrist (Pakistan Event Directory)  
**Date:** October 11, 2026  
**Document Purpose:** Baseline technical audit of existing database transitions, review note handlers, admin actions, and schema inconsistencies before implementing moderation workflows.

---

## 1. Current Status Flow

Currently, status transitions in application code are **strictly one-way (insertion/update to "Pending")**. There are **no transitions to "Approved", "Rejected", or "Needs Revision" anywhere in the codebase**. Any event in "Approved" or "Needs Revision" status was either seeded via mock data or manually updated directly in the Supabase database table.

### Exact Code Points Where Status is Written:

1. **Initial Event Creation (`status: "Pending"`)**
   - **File:** `src/app/submit-event/page.tsx`
   - **Line:** `341`
   - **Trigger:** Organizer submits a new event form (`handleSubmit`).
   - **Logic:**
     ```typescript
     const { error } = await supabase.from("events").insert([
       {
         organizer_id: user.id,
         // ...
         status: "Pending",
       },
     ]);
     ```

2. **Organizer Event Edit / Resubmission (`status: "Pending"`)**
   - **File:** `src/app/submit-event/page.tsx`
   - **Line:** `291`
   - **Trigger:** Organizer edits an event (`?id=...&mode=edit`) and clicks "Update Event".
   - **Logic:**
     ```typescript
     const { error } = await supabase
       .from("events")
       .update({
         // ...
         status: "Pending", // Forces status back to "Pending"
       })
       .eq("id", eventId)
       .eq("organizer_id", user.id);
     ```

3. **Status Transitions to 'Approved', 'Rejected', or 'Needs Revision':**
   - **Status:** **NON-EXISTENT IN CODE.**
   - There is no function, trigger, webhook, API route, or server action that updates `events.status` to `"Approved"`, `"Rejected"`, or `"Needs Revision"`.

---

## 2. Review Notes Logic

### Where `review_notes` is Written:
- **Status:** **NEVER WRITTEN IN THE APPLICATION CODE.**
- The column exists in the database schema (`src/lib/supabaseClient.ts`, lines `39`, `64`, `89` as `review_notes: string | null`), but no form, input, or mutation ever writes to it.

### Where `review_notes` is Read:
- `review_notes` is fetched and rendered in only two places, conditioned on "Needs Revision":
  1. **User Dashboard Submissions Tab:**
     - **File:** `src/app/dashboard/page.tsx`
     - **Fetch (Line 214):**
       ```typescript
       .select("id, event_name, event_date, status, city, review_notes")
       ```
     - **Render (Lines 879–887):**
       ```tsx
       {isNeedsRevision && item.review_notes && (
         <tr key={`${item.id}-feedback`} className="border-t-0 bg-transparent">
           <td colSpan={5} className="px-4 pb-3 pt-0 border-t-0">
             <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 sm:p-4 pr-4 sm:pr-6 mt-2 mb-3 shadow-sm">
               <p className="font-bold text-orange-900 text-sm mb-2">Reviewer feedback:</p>
               <p className="text-orange-800 text-sm leading-relaxed break-words">{item.review_notes}</p>
             </div>
           </td>
         </tr>
       )}
       ```
  2. **Dedicated My Submissions Page:**
     - **File:** `src/app/my-submissions/page.tsx`
     - **Fetch (Line 133):**
       ```typescript
       .select("id, event_name, event_date, status, city, review_notes")
       ```
     - **Render (Lines 318–327):** Exact duplicate of the dashboard feedback box above.

### Are Review Notes Ever Cleared Automatically?
- **NO.** When an organizer edits and resubmits an event in `src/app/submit-event/page.tsx` (lines `270–301`), `review_notes` is omitted from the `.update()` payload. If a row previously had feedback text, that text remains stored in the database indefinitely.

---

## 3. Existing Admin Actions

### Are there Server Actions or API routes for Approve / Reject?
- **NO.** There are **zero** moderation endpoints or server actions in the repository.

### Verification of Existing Routes & Actions:
- **`src/app/actions/` Directory:**
  - Only contains `src/app/actions/city.ts` (handles user primary city and cookies).
  - No `events.ts`, `moderation.ts`, or admin actions exist.
- **`src/app/api/` Directory:**
  - Does not exist. No REST or Route Handlers are defined.
- **`src/app/admin/page.tsx`:**
  - Merely a UI navigation shell created in previous steps.
  - Contains four visual sidebar tabs: "Core Moderation", "Content and Growth", "User and Community Management", and "Analytics".
  - The "Core Moderation" tab contains only a placeholder dashed box (`lines 191–207`) stating: *"Navigation shell initialized. Tables, filters, and actions for Core Moderation will be integrated here."*

---

## 4. Organizer Edit Flow

When an organizer edits an event via `/submit-event?id=[id]&mode=edit`:

### Exact DB Operation:
- **File:** `src/app/submit-event/page.tsx`, lines `270–301`
```typescript
const { error } = await supabase
  .from("events")
  .update({
    event_name: form.title,
    organizer_name: form.organizer_name,
    category: form.category,
    event_type: form.event_type,
    event_date: form.event_date,
    start_time: form.start_time || null,
    end_time: form.end_time || null,
    registration_opens: form.reg_opens || null,
    registration_deadline: form.reg_deadline || null,
    city: form.city,
    venue_location: form.location_details || form.city || "Venue TBD",
    description: form.description,
    registration_url: form.registration_url || null,
    website_social: form.website || null,
    fee: form.fee || "Free",
    status: "Pending", // <--- Hard resets status
    audience: audienceArray,
    level: levelArray,
    highlights: highlightsArray.length > 0 ? highlightsArray : [],
  })
  .eq("id", eventId)
  .eq("organizer_id", user.id);
```

### Consequences:
1. **`status` column:** Resets unconditionally to `"Pending"`, regardless of whether the event was previously `"Approved"`, `"Rejected"`, or `"Needs Revision"`.
2. **`review_notes` column:** Completely untouched. The previous rejection/revision feedback persists in the database row. (It is temporarily hidden on the client only because the UI checks `isNeedsRevision`, which evaluates to `false` once the status is `"Pending"`).

---

## 5. Identified Code Smells & Inconsistencies

### A. Fragmented and Permissive Status Strings (No Single Source of Truth)
In `src/app/dashboard/page.tsx` (lines `810–821`) and `src/app/my-submissions/page.tsx` (lines `249–260`), the frontend defensively checks 3 different string variations for revision status:
```typescript
const isNeedsRevision =
  lowerStatus === "needs revision" ||
  lowerStatus === "needs_revision" ||
  lowerStatus === "revision";
```
There is no database constraint (`CHECK` or enum) or TypeScript enum standardizing whether the database stores `"Needs Revision"` or `"needs_revision"`.

### B. Casing Discrepancies Between Queries and Mappers
- **Public Feed Query:**
  - `src/app/page.tsx` (line `79`) and `src/app/HomePageClient.tsx` (line `231`) query:
    ```typescript
    .eq("status", "Approved") // Capital 'A'
    ```
- **Mappers & Mock Data:**
  - `src/lib/mockData.ts` (line `6`) defines:
    ```typescript
    export type EventStatus = "pending" | "approved" | "completed" | "cancelled"; // all lowercase
    ```
  - `src/lib/mappers.ts` (line `44`), `src/app/dashboard/page.tsx` (line `64`), and `src/app/saved-events/page.tsx` (line `50`) hardcode:
    ```typescript
    status: "approved", // Lowercase 'a', completely ignoring the database row's actual status value!
    ```

### C. Complete Code Duplication of the Submissions Table
- `src/app/dashboard/page.tsx` (lines `780–878`) and `src/app/my-submissions/page.tsx` (lines `228–328`) contain ~100 lines of verbatim copy-pasted JSX:
  - Table headers, column widths, date formatting.
  - Status badge classes (`badgeCls`) and badges labels (`badgeLabel`).
  - Reviewer feedback box (`reviewer feedback:`).
  - Compact edit button markup.
- Neither file shares a unified component or utility function.

---

## 6. The Gap: What is Missing to Achieve Target Moderation

To achieve the full moderation workflow (Approve, Reject, Needs Revision with Notes, Resubmission with Cleared Notes), the following components must be built:

| Requirement | Current State | Missing Implementation |
| :--- | :--- | :--- |
| **Admin Actions** | Pure UI shell with no actions | Server actions / API functions to perform: <br>1. `approveEvent(id)` (`status = 'Approved'`) <br>2. `rejectEvent(id, notes)` (`status = 'Rejected'`, `review_notes = notes`) <br>3. `requestRevision(id, notes)` (`status = 'Needs Revision'`, `review_notes = notes`) |
| **Admin Core Moderation UI** | Placeholder dashed box in `/admin` | A moderation table in `/admin` listing all events with `status = 'Pending'` or `'Needs Revision'`, with action buttons and a feedback modal/input for notes. |
| **Clearing Notes on Resubmit** | `review_notes` is retained in `.update()` | When an organizer updates an event in `src/app/submit-event/page.tsx`, the update query must explicitly pass `review_notes: null`. |
| **Status Standardization** | Mixed casing and snake_case vs spaces | Standardize canonical database values to PascalCase (`"Pending"`, `"Approved"`, `"Rejected"`, `"Needs Revision"`) across both backend mutations and frontend checks. |
