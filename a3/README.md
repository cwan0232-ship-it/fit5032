# UrbanCanopy Melbourne – FIT5032 A3

UrbanCanopy Melbourne is a web application for a not-for-profit that connects Melbourne communities with tree planting, urban greening and biodiversity projects. A3 extends the A1.3 project (see `../a1.3`) with Firebase, Cloud Functions, maps, bookings and reporting.

**Live site:** https://fit5032-76ca9.web.app

## Business requirements

| BR | Where to find it |
| --- | --- |
| D.1 External authentication | Firebase Authentication with **Sign in with Google** (OAuth) or email and password (`src/services/auth.js`). Member profiles and roles are stored in the Firestore `members` collection. |
| D.2 Email with attachment | *My account → Email me a PDF* sends the member a PDF of their bookings through the `sendEmail` Cloud Function and SendGrid. |
| D.3 Interactive tables | `src/components/DataTable.vue`: sort, global search, search by each column, 10 rows per page. Used for planting sites, sessions, my bookings, members and all bookings. |
| D.4 Cloud deployment | Firebase Hosting. `/api/**` is rewritten to the REST Cloud Function. |
| E.1 Cloud Functions | `submitRating` in `functions/index.js`: checks each project rating on the server and recalculates the project average in a transaction, so scores cannot be faked from the browser. Other functions: `createBooking`, `cancelBooking`, `sendEmail`, `sendBulkEmail`, `api`. |
| E.2 Geo location | *Map* page (Leaflet + OpenStreetMap): place search with the nearest planting sites, and walking/cycling/driving routes with distance, time and directions. |
| E.3 Accessibility (WCAG 2.1 AA) | Skip link, labelled form controls, keyboard-operable tables, calendar and dialogs, `aria-live` status messages, text alternatives for the map and charts. Lighthouse accessibility score: 100 on every public page. |
| E.4 Export | CSV and PDF export on every table (`src/utils/export.js`). |
| F.1 Innovation | Calendar booking with conflict management, interactive Firestore charts, offline features and a public REST API. Bulk email and the admin dashboard are extra. |

## F.1 innovative features

1. **Appointment booking with a calendar** – FullCalendar month/week/list views. Booking rules run inside a Firestore transaction in the `createBooking` function: no double bookings, no overlapping sessions, no full or past sessions, and at most five upcoming bookings per member.
2. **Interactive charts** – the admin dashboard shows bookings per project and members by role with Chart.js, updated live from Firestore. Each chart has a data table alternative.
3. **Offline features** – an online/offline banner, a volunteer form draft saved in Local Storage, and Firestore's persistent local cache so bookings can still be read offline.
4. **REST API for partners** – public JSON routes:
   - `GET /api/sessions` (filters: `?type=`, `?upcoming=true`)
   - `GET /api/sessions/:id`
   - `GET /api/sites` (filters: `?suburb=`, `?status=`)
   - `GET /api/stats`

Extra: administrators can email selected members (bulk email) from the dashboard.

## Project structure

```
a3/
├── functions/           Cloud Functions (codebase "a3", region australia-southeast2)
├── scripts/             generate-data.mjs creates the mock sites and sessions
├── src/
│   ├── components/      Pages and shared components
│   ├── data/            Projects, planting sites and sessions
│   ├── firebase/        Firebase initialisation
│   ├── services/        Authentication, bookings, ratings, security helpers
│   └── utils/           Export and date formatting
├── firestore.rules      Security rules
└── firebase.json        Hosting, Functions and Firestore configuration
```

## Running locally

Requirements: Node.js 22+, the Firebase CLI and access to the Firebase project.

```bash
npm install
cp .env.example .env.local   # then add the Firebase web app settings (a ready .env is included in the submission zip)
npm run dev                  # http://localhost:5173
```

During development, `/api` requests are proxied to the deployed REST function.

To regenerate the mock data:

```bash
node scripts/generate-data.mjs
```

## Deploying

```bash
npm run build
firebase deploy --only hosting,firestore:rules,functions:a3 --project fit5032-76ca9
```

### Email setup (SendGrid)

1. Create a SendGrid API key and verify the sender address.
2. Store the key as a secret: `firebase functions:secrets:set SENDGRID_API_KEY`
3. Put the verified sender in `functions/.env.<project-id>`: `SENDGRID_FROM=you@example.com`
4. Redeploy the functions.

## Security

- Firestore rules only let members read their own profile and bookings; administrators can read everything. Nobody can promote themselves to admin from the browser.
- Bookings and session counts can only be changed by Cloud Functions.
- Members can only email themselves; bulk email is limited to administrators.
- A Content Security Policy limits scripts to the site itself and network requests to Firebase, OpenStreetMap and the routing service.
- CSV export escapes formula characters to prevent spreadsheet injection.

## Data sources

- Map tiles and place search: © OpenStreetMap contributors (Nominatim).
- Routing: FOSSGIS routing service (routing.openstreetmap.de).
- Planting sites and sessions are mock data created by `scripts/generate-data.mjs`.
