from pathlib import Path

base = [
    'User attempts login with an empty email field and no password.',
    'User enters an invalid email format that passes front-end validation but fails Supabase auth.',
    'User has a deleted account but still has a valid session cookie.',
    'Banned user tries to sign in and gets redirected unexpectedly.',
    'User signs in with valid credentials while the profiles table is temporarily unavailable.',
    'User logs in with a correct password but session is not persisted across a hard refresh.',
    'User is redirected to /login while already authenticated because middleware sees no session.',
    'User hits /submit without a session and loops between /login and /submit.',
    'User is authenticated but profile role is missing, causing admin-only routes to deny access.',
    'User clears cookies and is still treated as authenticated because stale local session data remains.',
    'Session expires during a long form submission and the action silently fails after the user has already filled data.',
    'User submits a signup with an email already registered in Supabase.',
    'User requests password reset for an unconfirmed or disabled account.',
    'User receives a password reset email but the callback route fails to exchange the code.',
    'OAuth callback returns without a session due to a missing redirect URL.',
    'User changes password but old session continues to exist and causes stale auth states.',
    'User logs out while another tab is still using the page and the UI still shows editable admin tools.',
    'User accesses /admin with a non-admin profile role but the page still renders admin data.',
    'User with role admin is blocked because the role in profiles is uppercase or mixed case.',
    'User triggers a server action without a valid cookie store in a server context.',
    'User has a profile row with null is_banned and the app treats it as false while a hidden ban policy expects true.',
    'User toggles ban state on a profile that does not exist, and the action reports success incorrectly.',
]

cities = ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Peshawar', 'Quetta', 'Multan', 'Faisalabad', 'Sialkot', 'Hyderabad']
roles = ['admin', 'organizer', 'user', 'banned', 'null']
routes = ['/admin', '/submit', '/submit-event', '/saved-events', '/my-submissions', '/dashboard', '/login', '/signup', '/onboarding']
filters = ['city', 'category', 'event type', 'price', 'mode', 'date', 'search term', 'audience', 'level', 'highlight']
reasons = ['Spam', 'Fake event', 'Offensive', 'Duplicate', 'Wrong location', 'Inappropriate content', 'Scam', 'Expired listing']
actions = ['login', 'signup', 'password reset', 'event submission', 'event update', 'report submission', 'admin ban toggle', 'report resolution', 'announcement creation', 'announcement deactivation']
fields = ['email', 'password', 'event name', 'organizer name', 'venue location', 'registration URL', 'website', 'fee', 'date', 'time']
terms = ['AI', 'Startup', 'Design', 'Hackathon', 'Networking', 'Music', 'Yoga', 'Community', 'Career', 'Tech']

scenarios = []
for idx in range(1, 1001):
    if idx <= 30:
        text = f'{idx:04d}. {base[(idx - 1) % len(base)]}'
    else:
        route = routes[(idx * 7) % len(routes)]
        city = cities[(idx * 3) % len(cities)]
        city2 = cities[(idx * 11 + 2) % len(cities)]
        role = roles[(idx * 5) % len(roles)]
        filter_name = filters[(idx * 13) % len(filters)]
        action_name = actions[(idx * 17) % len(actions)]
        field_name = fields[(idx * 19) % len(fields)]
        term = terms[(idx * 29) % len(terms)]
        reason = reasons[(idx * 31) % len(reasons)]
        report_action = ['hide_event', 'dismiss'][idx % 2]

        if idx % 3 == 0:
            text = f'{idx:04d}. User in {city} changes selected city to {city2}, but the cookie, URL params, and Supabase profile stay out of sync, leading to stale event results.'
        elif idx % 5 == 0:
            text = f'{idx:04d}. User filters {filter_name} while searching for {term}; the query uses a stale URL param and returns wrong data due to pagination or race conditions.'
        elif idx % 7 == 0:
            text = f'{idx:04d}. Admin resolves report with {report_action} for a reason of {reason}, but the event remains visible or the report remains pending because the update path is incomplete.'
        elif idx % 11 == 0:
            text = f'{idx:04d}. User with role {role} accesses {route}; if role data is null or mismatched, the app may show unauthorized admin controls or block valid organizer actions.'
        elif idx % 13 == 0:
            text = f'{idx:04d}. User submits an event with a missing or invalid {field_name}; the form succeeds on client side, but server-side validation fails and leaves a broken record in the database.'
        elif idx % 17 == 0:
            text = f'{idx:04d}. User opens a page in a timezone different from PKT; event dates near midnight are shifted, causing past or future events to be displayed incorrectly.'
        else:
            text = f'{idx:04d}. User on {route} triggers a problem when {action_name} with {field_name} set to a value that breaks the app state or backend validation in {city}.'
    scenarios.append(text)

path = Path('d:/fehrist/problem_scenarios_1000.txt')
path.write_text('\n'.join(scenarios) + '\n', encoding='utf-8')
print(f'Wrote {len(scenarios)} scenarios to {path}')
print(f'File size: {path.stat().st_size} bytes')
