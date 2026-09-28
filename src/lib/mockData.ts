// lib/mockData.ts
// Realistic mock data for Fehrist — Pakistan's event discovery directory.
// Matches the `events` table schema defined in brief.md.
// Replace with Supabase queries when the database is connected.

export type EventStatus = "pending" | "approved" | "completed" | "cancelled";

export type EventCategory =
  | "Technology"
  | "Business"
  | "Arts & Culture"
  | "Music"
  | "Sports"
  | "Education"
  | "Health & Wellness"
  | "Gaming"
  | "Community"
  | "Food & Lifestyle";

export type EventType =
  | "Conference"
  | "Workshop"
  | "Hackathon"
  | "Meetup"
  | "Competition"
  | "Exhibition"
  | "Seminar"
  | "Concert"
  | "Festival"
  | "Webinar";

export interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;       // ISO date string: "YYYY-MM-DD"
  start_time: string;       // "HH:MM"
  end_time: string;         // "HH:MM"
  city: string;
  category: EventCategory;
  event_type: EventType;
  location_details: string;
  registration_url: string;
  organizer_name: string;
  is_verified: boolean;
  status: EventStatus;
  submitted_by_user_id: string;
}

// All dates relative to current date context: 2026-09-28 (PKT)
export const mockEvents: Event[] = [
  // -- HAPPENING TODAY -------------------------------------------------------
  {
    id: "evt-001",
    title: "DragonByte Coding Challenge 2026 - Final Round",
    description:
      "The prestigious DragonByte Coding Challenge returns for its grand finale. Top 64 programmers from across Pakistan compete in three grueling rounds of algorithmic problem-solving. Live scoreboard, audience Q&A, and prize distribution ceremony included. Snacks and refreshments provided.",
    event_date: "2026-10-04",
    start_time: "09:00",
    end_time: "18:00",
    city: "Lahore",
    category: "Technology",
    event_type: "Competition",
    location_details: "LUMS Gymnasium, Lahore University of Management Sciences, DHA, Lahore",
    registration_url: "https://dragonbyte.pk/final-2026",
    organizer_name: "DragonByte Foundation",
    is_verified: true,
    status: "approved",
    submitted_by_user_id: "user-101",
  },
  {
    id: "evt-002",
    title: "Karachi Tech Meetup - AI in Production",
    description:
      "Monthly gathering of Karachi's tech community. This edition focuses on deploying AI models to production: MLOps pipelines, cost optimization, and real-world case studies from Pakistani startups. Networking dinner follows the talks.",
    event_date: "2026-09-28",
    start_time: "18:30",
    end_time: "21:30",
    city: "Karachi",
    category: "Technology",
    event_type: "Meetup",
    location_details: "The Karachi Hub, BC-4 Block 5, Clifton, Karachi",
    registration_url: "https://khi-tech.pk/meetup/sep2026",
    organizer_name: "Karachi Tech Community",
    is_verified: true,
    status: "approved",
    submitted_by_user_id: "user-102",
  },

  // -- UPCOMING - Registration Open -----------------------------------------
  {
    id: "evt-003",
    title: "PakistanDevCon 2026",
    description:
      "Pakistan's largest annual developer conference, bringing together 1,200+ engineers, product managers, and tech founders. Two-day event featuring 40+ talks across four tracks: Web, Mobile, AI/ML, and Cloud. Early bird tickets available.",
    event_date: "2026-10-15",
    start_time: "08:30",
    end_time: "19:00",
    city: "Islamabad",
    category: "Technology",
    event_type: "Conference",
    location_details: "Pak-China Friendship Centre, Shahra-e-Jamhuriat, Islamabad",
    registration_url: "https://pakistandevcon.com/2026",
    organizer_name: "PSEB (Pakistan Software Export Board)",
    is_verified: true,
    status: "approved",
    submitted_by_user_id: "user-103",
  },
  {
    id: "evt-004",
    title: "Startup Weekend Lahore - HealthTech Edition",
    description:
      "54 hours to build a HealthTech startup from scratch. Join 200+ entrepreneurs, designers, and developers. Mentors include veteran VCs and founders of leading Pakistani health platforms. Winners receive seed funding and LUMS incubation access.",
    event_date: "2026-10-09",
    start_time: "18:00",
    end_time: "21:00",
    city: "Lahore",
    category: "Business",
    event_type: "Hackathon",
    location_details: "Plan9 Tech Incubator, 5th Floor, ARFA Software Technology Park, Lahore",
    registration_url: "https://startupweekend.org/lahore-oct-2026",
    organizer_name: "Startup Weekend Pakistan",
    is_verified: true,
    status: "approved",
    submitted_by_user_id: "user-104",
  },
  {
    id: "evt-005",
    title: "National Freelancing Summit 2026",
    description:
      "A full-day summit empowering Pakistan's 1.5 million+ freelancers. Topics include client acquisition, international payment solutions, tax compliance, and scaling from solo freelancer to agency. Featuring top earners from Upwork, Fiverr, and Toptal.",
    event_date: "2026-10-22",
    start_time: "09:00",
    end_time: "17:00",
    city: "Rawalpindi",
    category: "Business",
    event_type: "Conference",
    location_details: "Ayub Convention Centre, The Mall, Rawalpindi",
    registration_url: "https://freelancingsummit.pk/2026",
    organizer_name: "erozgar Initiative Pakistan",
    is_verified: true,
    status: "approved",
    submitted_by_user_id: "user-105",
  },
  {
    id: "evt-006",
    title: "Islamabad Open Source Hackathon",
    description:
      "48-hour hackathon dedicated entirely to open-source contributions. Build new features for open-source projects, fix long-standing bugs, or create new tools for the community. Prizes for most impactful, most creative, and best newcomer contributions.",
    event_date: "2026-11-01",
    start_time: "10:00",
    end_time: "18:00",
    city: "Islamabad",
    category: "Technology",
    event_type: "Hackathon",
    location_details: "NUST H-12 Campus, Software Engineering Department, Islamabad",
    registration_url: "https://oshack.islb.pk",
    organizer_name: "Open Source Pakistan",
    is_verified: false,
    status: "approved",
    submitted_by_user_id: "user-106",
  },
  {
    id: "evt-007",
    title: "Lahore Literature Festival - Digital Age Edition",
    description:
      "LLF returns with a special focus on writing in the digital age: blogging, social media content, AI-assisted writing, and the future of publishing. Authors, journalists, and digital creators share the stage over two days.",
    event_date: "2026-11-07",
    start_time: "10:00",
    end_time: "20:00",
    city: "Lahore",
    category: "Arts & Culture",
    event_type: "Festival",
    location_details: "Alhamra Arts Council, The Mall Road, Lahore",
    registration_url: "https://lahoreliteraturefestival.org/2026",
    organizer_name: "LLF Foundation",
    is_verified: true,
    status: "approved",
    submitted_by_user_id: "user-107",
  },
  {
    id: "evt-008",
    title: "Coke Studio Live - Season 17 Finale Concert",
    description:
      "Experience Pakistan's most celebrated music platform LIVE. Season 17 finale concert featuring Atif Aslam, Maher Zain, Arooj Aftab, and Young Stunners. Outdoor amphitheater setting with premium seating tiers.",
    event_date: "2026-10-31",
    start_time: "19:00",
    end_time: "23:30",
    city: "Karachi",
    category: "Music",
    event_type: "Concert",
    location_details: "Creek Club Grounds, Phase 8 DHA, Karachi",
    registration_url: "https://bokingshai.com/coke-studio-finale-2026",
    organizer_name: "Coca-Cola Pakistan",
    is_verified: true,
    status: "approved",
    submitted_by_user_id: "user-108",
  },
  {
    id: "evt-009",
    title: "Cybersecurity Awareness Workshop - Karachi",
    description:
      "Hands-on workshop covering the fundamentals of personal and corporate cybersecurity. Topics: phishing simulations, password hygiene, VPN usage, social engineering, and incident response for SMEs. Certified trainers from PTA's digital safety wing.",
    event_date: "2026-10-05",
    start_time: "10:00",
    end_time: "15:00",
    city: "Karachi",
    category: "Technology",
    event_type: "Workshop",
    location_details: "SZABIST Clifton Campus, Block 5, Clifton, Karachi",
    registration_url: "https://ptasafety.gov.pk/workshop/khi-oct26",
    organizer_name: "PTA Digital Safety Wing",
    is_verified: true,
    status: "approved",
    submitted_by_user_id: "user-109",
  },
  {
    id: "evt-010",
    title: "Women in Tech Pakistan - Annual Summit",
    description:
      "A safe, inspiring space celebrating and advancing women in Pakistan's technology sector. Panel discussions on gender parity, mentorship programs, scholarship announcements, and keynotes from senior women engineers at Google, Microsoft, and local tech firms.",
    event_date: "2026-10-18",
    start_time: "09:30",
    end_time: "17:30",
    city: "Lahore",
    category: "Technology",
    event_type: "Conference",
    location_details: "Packages Mall Convention Hall, Walton Road, Lahore",
    registration_url: "https://witpakistan.org/summit-2026",
    organizer_name: "Women in Tech Pakistan",
    is_verified: true,
    status: "approved",
    submitted_by_user_id: "user-110",
  },
  {
    id: "evt-011",
    title: "Mobile Gaming Championship - PUBG & Valorant",
    description:
      "Pakistan's biggest mobile and PC gaming tournament. Open bracket for PUBG Mobile (squads) and Valorant (5v5). Total prize pool: PKR 5 million. Free spectator entry. Merchandise, food stalls, and live streaming on all major platforms.",
    event_date: "2026-10-25",
    start_time: "11:00",
    end_time: "22:00",
    city: "Lahore",
    category: "Gaming",
    event_type: "Competition",
    location_details: "Expo Centre Lahore, Johar Town, Lahore",
    registration_url: "https://pgc.pk/championship-2026",
    organizer_name: "Pakistan Gamers Community",
    is_verified: true,
    status: "approved",
    submitted_by_user_id: "user-111",
  },
  {
    id: "evt-012",
    title: "Agri-Tech Seminar - Smart Farming in Pakistan",
    description:
      "Bringing together agricultural scientists, tech entrepreneurs, and government officials to discuss drone-based crop monitoring, IoT soil sensors, AI-driven yield prediction, and the future of food security in Pakistan. Simultaneous Urdu translation available.",
    event_date: "2026-10-12",
    start_time: "09:00",
    end_time: "16:00",
    city: "Faisalabad",
    category: "Technology",
    event_type: "Seminar",
    location_details: "University of Agriculture Faisalabad, Main Auditorium",
    registration_url: "https://uaf.edu.pk/agritech-seminar-2026",
    organizer_name: "University of Agriculture Faisalabad",
    is_verified: true,
    status: "approved",
    submitted_by_user_id: "user-112",
  },
  {
    id: "evt-013",
    title: "Karachi Food Festival 2026",
    description:
      "Three days of culinary excellence celebrating Pakistan's rich food heritage alongside global cuisines. 120+ food stalls, live cooking demonstrations by celebrity chefs, cultural performances, and a dedicated kids' activity zone.",
    event_date: "2026-11-14",
    start_time: "12:00",
    end_time: "23:00",
    city: "Karachi",
    category: "Food & Lifestyle",
    event_type: "Festival",
    location_details: "Do Darya, Phase 8 DHA, Karachi",
    registration_url: "https://karachifoodfestival.pk/2026",
    organizer_name: "Karachi Events Co.",
    is_verified: false,
    status: "approved",
    submitted_by_user_id: "user-113",
  },
  {
    id: "evt-014",
    title: "Mental Health Awareness Walk - Islamabad",
    description:
      "Community walk and open-air event to break the stigma around mental health in Pakistan. Featuring talks by licensed psychologists, meditation sessions, art therapy corners, and resource booths for local mental health services.",
    event_date: "2026-10-10",
    start_time: "07:00",
    end_time: "11:00",
    city: "Islamabad",
    category: "Health & Wellness",
    event_type: "Meetup",
    location_details: "F-9 Park (Fatima Jinnah Park), Islamabad",
    registration_url: "https://mentalhealthpak.org/walk-2026",
    organizer_name: "Mind Matters Pakistan",
    is_verified: false,
    status: "approved",
    submitted_by_user_id: "user-114",
  },
  {
    id: "evt-015",
    title: "E-Commerce Growth Webinar - Scaling on Daraz & Amazon",
    description:
      "Online webinar for Pakistani sellers looking to scale their e-commerce businesses. Experts from Daraz Pakistan and Amazon Global Selling cover product listing optimization, PPC advertising, logistics, and export opportunities from Pakistan.",
    event_date: "2026-10-08",
    start_time: "20:00",
    end_time: "22:00",
    city: "Karachi",
    category: "Business",
    event_type: "Webinar",
    location_details: "Online (Zoom - link sent on registration)",
    registration_url: "https://ecomgrow.pk/webinar-oct26",
    organizer_name: "eComGrow Pakistan",
    is_verified: false,
    status: "approved",
    submitted_by_user_id: "user-115",
  },

  // -- PENDING ADMIN APPROVAL ------------------------------------------------
  {
    id: "evt-016",
    title: "Quetta Tech Talks - Vol. 3",
    description:
      "A grassroots tech meetup bringing together developers, students, and innovators from Balochistan. Topics this round: cloud computing basics, freelancing opportunities, and building Balochistan's first tech community hub.",
    event_date: "2026-10-20",
    start_time: "17:00",
    end_time: "20:00",
    city: "Quetta",
    category: "Technology",
    event_type: "Meetup",
    location_details: "University of Balochistan, CS Department Auditorium, Quetta",
    registration_url: "https://quettatech.pk/vol3",
    organizer_name: "Quetta Developers Circle",
    is_verified: false,
    status: "pending",
    submitted_by_user_id: "user-116",
  },
  {
    id: "evt-017",
    title: "Peshawar Sports Gala 2026",
    description:
      "Annual sports gala organized by youth groups in Peshawar covering cricket, football, badminton, and athletics. Open registration for all age groups. Medal ceremony and trophy presentation on closing day.",
    event_date: "2026-11-05",
    start_time: "08:00",
    end_time: "18:00",
    city: "Peshawar",
    category: "Sports",
    event_type: "Competition",
    location_details: "Qayyum Sports Complex, Ring Road, Peshawar",
    registration_url: "https://peshawargala.com/2026",
    organizer_name: "Peshawar Youth Alliance",
    is_verified: false,
    status: "pending",
    submitted_by_user_id: "user-117",
  },

  // -- COMPLETED (Past events) -----------------------------------------------
  {
    id: "evt-018",
    title: "PyCon Pakistan 2026",
    description:
      "Pakistan's annual Python conference, attended by 800+ Pythonistas. Covered data science, web development with Django/FastAPI, automation scripting, and open-source contribution. All talks recorded and available on YouTube.",
    event_date: "2026-09-14",
    start_time: "09:00",
    end_time: "18:00",
    city: "Karachi",
    category: "Technology",
    event_type: "Conference",
    location_details: "IBA Main Campus, University Road, Karachi",
    registration_url: "https://pycon.pk/2026",
    organizer_name: "Python Pakistan",
    is_verified: true,
    status: "completed",
    submitted_by_user_id: "user-118",
  },
  {
    id: "evt-019",
    title: "UI/UX Design Workshop - Figma Masterclass",
    description:
      "Intensive 2-day Figma workshop for designers and product managers. Covered component libraries, auto-layout, prototyping, and design handoff. Participants received a certificate and access to a private resource library.",
    event_date: "2026-09-20",
    start_time: "10:00",
    end_time: "17:00",
    city: "Lahore",
    category: "Technology",
    event_type: "Workshop",
    location_details: "Colabs, 2nd Floor, Gulberg III, Lahore",
    registration_url: "https://designlahore.pk/figma-sep26",
    organizer_name: "Design Lahore",
    is_verified: true,
    status: "completed",
    submitted_by_user_id: "user-119",
  },
  {
    id: "evt-020",
    title: "Multan Cultural Heritage Exhibition",
    description:
      "A week-long exhibition celebrating Multan's rich history - the City of Saints. Displayed rare Multani pottery, blue tilework, Sufi manuscripts, and traditional crafts. Proceeds went to local artisan cooperatives.",
    event_date: "2026-09-10",
    start_time: "10:00",
    end_time: "20:00",
    city: "Multan",
    category: "Arts & Culture",
    event_type: "Exhibition",
    location_details: "Multan Arts Council, Nishtar Road, Multan",
    registration_url: "https://multanarts.gov.pk/heritage-expo-2026",
    organizer_name: "Multan Arts Council",
    is_verified: true,
    status: "completed",
    submitted_by_user_id: "user-120",
  },
];

// -- Derived helpers used by UI components -----------------------------------

export const CITIES = [
  "All Cities",
  "Karachi",
  "Lahore",
  "Islamabad",
  "Rawalpindi",
  "Peshawar",
  "Quetta",
  "Faisalabad",
  "Multan",
] as const;

export const CATEGORIES: EventCategory[] = [
  "Technology",
  "Business",
  "Arts & Culture",
  "Music",
  "Sports",
  "Education",
  "Health & Wellness",
  "Gaming",
  "Community",
  "Food & Lifestyle",
];

export const EVENT_TYPES: EventType[] = [
  "Conference",
  "Workshop",
  "Hackathon",
  "Meetup",
  "Competition",
  "Exhibition",
  "Seminar",
  "Concert",
  "Festival",
  "Webinar",
];

/**
 * Derives a human-readable UI status label for an event badge.
 * Logic:
 *  - "completed" or "cancelled" -> use as-is
 *  - event_date === today        -> "Happening Today"
 *  - event_date in the future   -> "Registration Open"
 */
export function getEventUIStatus(
  event: Event,
  todayISO: string
): "Happening Today" | "Registration Open" | "Upcoming" | "Completed" | "Cancelled" | "Pending" {
  if (event.status === "cancelled") return "Cancelled";
  if (event.status === "completed") return "Completed";
  if (event.status === "pending") return "Pending";
  if (event.event_date === todayISO) return "Happening Today";
  if (event.event_date > todayISO) return "Registration Open";
  return "Upcoming";
}

/** Returns only approved events - suitable for the public homepage feed. */
export const approvedEvents = mockEvents.filter((e) => e.status === "approved");

/** Returns events pending admin review - suitable for the admin console. */
export const pendingEvents = mockEvents.filter((e) => e.status === "pending");
