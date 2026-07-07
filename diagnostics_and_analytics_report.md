# Diagnostics and Analytics Integration Report

This report summarizes the status of the ArcadeCore admin dashboard metrics, detailing the transition from static simulated segments to live database connections and verifying integration endpoints.

---

## 🟢 Widgets Connected to Live Data

These widgets are backed by actual PostgreSQL database queries via Prisma Client and update dynamically:

1.  **Total Registered Users**: Queries `db.user.count()`. No offsets or mock additions.
2.  **Live Online Users**: Queries active game sessions from the `LivePlayer` model within the last 15 minutes.
3.  **Razorpay Total Revenue**: Aggregates the sum of successful coin purchases from the `Transaction` table (`status: 'SUCCESS'`).
4.  **New Users Today**: Queries registered user accounts created in the last 24 hours.
5.  **Games Played Today**: Counts logs written to the `GamePlay` table since midnight.
6.  **User Behavior Doughnut Chart**: 
    *   *New users*: Users created in the last 24 hours.
    *   *Active users*: Unique users with gameplay logs in the last 24 hours.
    *   *Returning users*: Users registered before today who played a game in the last 24 hours.
7.  **Monthly Revenue timeline Chart**: Aggregates successful transaction amounts grouped by month of the current year.
8.  **Active Platform Users Table**: Lists the newest 15 registered users in the database, showing their profile image, email, VIP status, and registration date.
9.  **User Deletions**: Deletes records directly from the database (making the ban action fully persistent).

---

## 🔴 Widgets Awaiting External Integrations

These widgets display **"Not connected"** or **"No sensor integration"** as required because their external APIs are not yet linked to the platform:

1.  **Google AdSense Revenue / Impressions**: Labeled as **"Not connected"** until AdSense publisher IDs are configured.
2.  **Google Search Console**: Labeled as **"Not connected"** until Search Console API authorization is active.
3.  **GA4 Traffic Metrics**: Labeled as **"Not connected"** until Google Analytics measurement IDs are mapped.
4.  **Average Session Duration**: Labeled as **"No sensor integration"** (will be configured using client telemetry).
5.  **Clarity Traffic Tracking**: Labeled as **"Not connected"** until Microsoft Clarity script tags are inserted.
6.  **Cloudinary Media CDN**: Labeled as **"Not connected"** until Cloudinary credentials are added to environment variables.
7.  **Redis Cache Database**: Labeled as **"Not connected"** (using Postgres directly for sessions and state).
8.  **Background Queue Service**: Labeled as **"Inactive"**.
9.  **Cron Jobs / Scheduled Timers**: Labeled as **"Not configured"**.

---

## 🔍 Diagnostics Summary

The new **Diagnostics** tab provides a real-time status check of active services:

*   **PostgreSQL Database**: Checks connection using raw ping (`db.$queryRaw`).
*   **Clerk Auth Sync**: Verifies presence of secret keys.
*   **Razorpay Payments Gate**: Verifies presence of secret keys.
*   **Google Analytics / Clarity**: Verifies tag installations.

---

## 🚫 Placeholders & Hardcoded Values

*   **Remaining Placeholders**: None.
*   **Remaining Hardcoded Values**: None. All variables, charts, and tables display either the exact database aggregate or a strict "Not connected" indicator.
