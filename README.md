# NotifyGlobal 🌐

> Multilingual bulk email notification platform — built for the [Lingo.dev Hackathon](https://luma.com/hu7ceyo4)

[![Live Demo](https://img.shields.io/badge/Live-notify--global.vercel.app-4F46E5?style=for-the-badge)](https://notify-global.vercel.app/)
[![GitHub](https://img.shields.io/badge/GitHub-ShadowAdi%2FNotifyGlobal-181717?style=for-the-badge&logo=github)](https://github.com/ShadowAdi/NotifyGlobal)
[![Lingo.dev](https://img.shields.io/badge/Powered%20by-Lingo.dev-06B6D4?style=for-the-badge)](https://lingo.dev)

---

## What is it?

NotifyGlobal lets you send bulk email campaigns to large contact lists where **each recipient gets the email in their own language** — automatically translated at send time using the [Lingo.dev](https://lingo.dev) API.

You create a project, add templates, import contacts (with their preferred language), build a campaign, and hit send. That's it.

---

## Features

- **Projects** — organize everything under separate projects
- **Templates** — reusable HTML or plain-text email templates per project
- **Contacts** — contact book per project; each contact needs an email and can have a preferred language (`en`, `fr`, `hi`, `es`, etc.)
- **Campaigns** — pick a template + contacts, send in bulk with one click
- **Multilingual sends** — Lingo.dev translates the email body into each contact's preferred language at send time
- **API Keys** — generate keys and trigger campaigns from your own backend via a REST endpoint
- **HTML Template Editor** — rich editor for styled emails
- **Basic Analytics** — open/click tracking per campaign
- **Scheduled Sends** *(partial)* — UI is there, cron execution is WIP

---

## How It Works

```
User creates account
  └── Creates a Project
        ├── Adds Templates (HTML/text email layouts)
        ├── Adds Contacts (email + optional language preference)
        └── Creates a Campaign
              └── Selects template + contacts → clicks Send
                    └── For each contact:
                          ├── if language set → Lingo.dev translates body
                          └── Email dispatched in their language
```

---

## Lingo.dev Integration

The whole multilingual angle runs through Lingo.dev. When a campaign fires:

1. Fetch the contact's preferred language code
2. Send the email body to Lingo.dev for translation
3. Use the translated content for that recipient
4. Contacts with no language preference get the original

One campaign → emails in English, French, Spanish, Hindi, whatever — simultaneously.

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS + shadcn/ui |
| Auth & Storage | Supabase |
| Database | PostgreSQL (via Supabase) |
| ORM | Drizzle ORM |
| Translation | Lingo.dev API |
| Email | Nodemailer / SMTP |
| Deployment | Vercel |
| Language | TypeScript |

---

## Project Structure

```
.
├── app/
│   ├── (auth)/          # Login, register, password reset
│   ├── (dashboard)/     # Main app — projects, templates, contacts, campaigns
│   └── api/             # API routes + trigger endpoint
├── actions/             # Next.js Server Actions
├── components/          # Shared UI components
├── config/              # App-wide constants
├── context/             # React context providers
├── db/                  # Drizzle schema + DB client
├── lib/                 # Utilities (Lingo.dev client, email sender, etc.)
├── supabase/            # Supabase client config
├── types/               # Shared TypeScript types
├── .env                 # Environment variables
└── drizzle.config.ts    # Drizzle ORM config
```

---

## API — Trigger Endpoint

Users can generate API keys and fire campaigns from external systems.

```http
POST /api/trigger
Authorization: Bearer <YOUR_API_KEY>
Content-Type: application/json

{
  "campaignId": "uuid",
  "contactIds": ["uuid", "uuid"]  // optional — omit to send to all
}
```

---

## Local Setup

**Prerequisites:** Node.js 18+, a Supabase project, a Lingo.dev API key, and an SMTP provider.

```bash
git clone https://github.com/ShadowAdi/NotifyGlobal.git
cd NotifyGlobal
npm install
cp .env.example .env   # fill in your credentials
npx drizzle-kit push
npm run dev
```

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
LINGO_API_KEY=
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
NEXTAUTH_SECRET=
```

---

## Roadmap

- [x] Bulk email campaigns
- [x] Per-contact language preference via Lingo.dev
- [x] API key system + trigger endpoint
- [x] HTML template editor
- [x] Basic analytics (open/click tracking)
- [ ] Scheduled sends (cron jobs)
- [ ] SMS / phone notifications
- [ ] Slack integration
- [ ] Discord integration
- [ ] WhatsApp integration
- [ ] Advanced analytics (bounce, unsubscribe)

---

## License

MIT