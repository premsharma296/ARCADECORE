# Provisioning Your PostgreSQL Database

To store user leaderboards, comments, and coin balances persistently in production, you need a live PostgreSQL database. Here are the two best free options.

---

## Option 1: Neon.tech (Recommended & Easiest for Prisma)

Neon is a free serverless PostgreSQL database that matches Prisma's architecture perfectly.

1.  Go to [Neon.tech](https://neon.tech) and sign up for a free account.
2.  Click **"Create Project"**.
3.  Name your project `arcadecore` and select the region closest to your Vercel deployment (e.g., US East or Europe).
4.  Once created, Neon will show you a connection string box. Make sure **"Prisma"** is selected, or copy the standard URL which looks like:
    `postgres://[USER]:[PASSWORD]@ep-[ID].us-east-2.aws.neon.tech/neondb?sslmode=require`
5.  Go to your **Vercel Project Settings ➜ Environment Variables** and add:
    *   **Key**: `DATABASE_URL`
    *   **Value**: *(Paste your Neon connection string here)*

---

## Option 2: Vercel Postgres (One-Click Setup)

Vercel provides a built-in serverless Postgres instance.

1.  Go to your project dashboard on Vercel.
2.  Click the **"Storage"** tab in the top menu.
3.  Click **"Connect Database"** ➜ select **"Postgres"** ➜ click **"Create New"**.
4.  Accept the terms, name the database, and click **"Create & Connect"**.
5.  Vercel will automatically inject multiple environment variables into your settings, including `POSTGRES_PRISMA_URL` and `POSTGRES_URL`.
6.  To link this to your Prisma schema:
    *   Open [schema.prisma](file:///Users/premchandsharma/.gemini/antigravity/scratch/arcade-core/prisma/schema.prisma)
    *   Change the `url` variable on line 9 to:
        `url = env("POSTGRES_PRISMA_URL")`
    *   Commit and push this minor change to GitHub:
        ```bash
        git add prisma/schema.prisma
        git commit -m "chore: link to vercel postgres"
        git push
        ```

---

## 🚀 Running Your First Migration (Database Setup)

Once the `DATABASE_URL` is set, you need to create the tables in your new database. 

If you are using **Vercel**, Vercel runs migrations automatically during build because we updated the build command in `package.json` to generate client structures. 

If you want to manually seed the catalog into the live database from your local Mac, run:
```bash
cd /Users/premchandsharma/.gemini/antigravity/scratch/arcade-core
npx prisma db push
npx prisma db seed
```
This pushes your schema structure to the cloud database and inserts the game catalog seed files automatically.
