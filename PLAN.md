# Domain Marketplace — MVP Plan

## What Are We Building?

A marketplace where people can **list domains for sale** and **buyers can discover them**.

- Sellers sign up via SSO, list their domain, verify they own it via DNS, and get listed publicly.
- Buyers browse verified listings and contact sellers directly via email.
- No payments on-platform. Simple, fast, shippable in 2 hours.

---

## Tools & Tech Stack

| Layer | Tool | Why |
|---|---|---|
| Framework | Next.js 15 (App Router) | Full-stack, one repo, Server Actions |
| Styling | Tailwind CSS v4 | Utility-first, fast |
| Components | shadcn/ui | Pre-built accessible components |
| Auth | Supabase Auth (SSO only) | Google + GitHub OAuth, free, zero config |
| Database | Supabase Postgres | Free tier, managed, built-in dashboard |
| DNS Verification | Google DNS-over-HTTPS API | Free, no API key, checks TXT records |
| Deployment | Vercel | Free tier, zero-config Next.js |

**No Stripe. No payments. No email service needed.**

---

## Features We Are Shipping (MVP)

### Auth
- [x] Sign up / Sign in via **Google SSO**
- [x] Sign up / Sign in via **GitHub SSO**
- [x] No email/password — SSO only

### Seller Features
- [x] Create a domain listing (domain name, asking price, description, category, contact email)
- [x] Get a unique DNS TXT verification token per listing
- [x] View verification instructions in dashboard
- [x] Click "Check Verification" to trigger DNS lookup
- [x] Listing goes live only after domain is verified
- [x] Edit listing (price, description, contact email)
- [x] Remove listing

### Buyer Features
- [x] Browse all **verified** listings (public, no login needed)
- [x] Search by domain name
- [x] Filter by category and price range
- [x] View domain detail page (price, description, contact email)
- [x] Contact seller directly via email (off-platform)

### What We Are NOT Building (Post-Launch)
- [ ] Payments / Stripe
- [ ] Offers / negotiation
- [ ] Auctions / bidding
- [ ] Reviews / ratings
- [ ] Admin panel
- [ ] Email notifications
- [ ] Domain transfer tracking

---

## Database Schema

### Table: `profiles`
Created automatically when a user signs in for the first time via SSO.

```sql
id          uuid PRIMARY KEY  -- matches Supabase auth user ID
email       text
name        text
avatar_url  text
created_at  timestamp DEFAULT now()
```

### Table: `listings`

```sql
id                uuid PRIMARY KEY DEFAULT gen_random_uuid()
seller_id         uuid REFERENCES profiles(id)
domain_name       text NOT NULL UNIQUE          -- e.g. "example.com"
asking_price      integer                        -- in cents (nullable = price on request)
description       text
category          text                           -- tech | finance | health | ecommerce | other
contact_email     text                           -- where buyers reach out
verify_token      text NOT NULL                  -- TXT record value e.g. "domainmarket-verify=<uuid>"
status            text DEFAULT 'pending_verification'
                  -- pending_verification | verified | sold | removed
created_at        timestamp DEFAULT now()
updated_at        timestamp DEFAULT now()
```

### Row Level Security (RLS) Policies

| Table | Operation | Rule |
|---|---|---|
| listings | SELECT | status = 'verified' OR seller_id = auth.uid() |
| listings | INSERT | seller_id = auth.uid() |
| listings | UPDATE | seller_id = auth.uid() |
| listings | DELETE | seller_id = auth.uid() |

---

## File & Folder Structure

```
/
├── app/
│   ├── page.tsx                          ← Homepage (hero + recent verified listings)
│   ├── sign-in/
│   │   └── page.tsx                      ← SSO buttons only (Google + GitHub)
│   ├── listings/
│   │   ├── page.tsx                      ← Browse verified listings (search + filter)
│   │   └── [id]/
│   │       └── page.tsx                  ← Domain detail page
│   ├── dashboard/
│   │   ├── layout.tsx                    ← Auth guard (redirect to /sign-in if not logged in)
│   │   ├── page.tsx                      ← My listings overview
│   │   ├── listings/
│   │   │   ├── new/
│   │   │   │   └── page.tsx              ← Create listing form
│   │   │   └── [id]/
│   │   │       ├── page.tsx              ← Listing detail + verification instructions
│   │   │       └── edit/
│   │   │           └── page.tsx          ← Edit listing
│   └── api/
│       └── verify/
│           └── [id]/
│               └── route.ts              ← DNS TXT lookup → update listing status
├── lib/
│   ├── supabase/
│   │   ├── client.ts                     ← Browser Supabase client
│   │   └── server.ts                     ← Server Supabase client (Server Actions / Route Handlers)
│   └── validations.ts                    ← Zod schemas for listing form
├── components/
│   ├── ui/                               ← shadcn/ui components
│   ├── listing-card.tsx                  ← Domain card for browse page
│   ├── listing-form.tsx                  ← Create/edit listing form
│   ├── verify-button.tsx                 ← "Check Verification" button with loading state
│   └── nav.tsx                           ← Top navigation bar
├── middleware.ts                          ← Protect /dashboard/* routes via Supabase session
├── supabase/
│   └── schema.sql                        ← Full SQL schema + RLS policies (run in Supabase)
└── .env.local                            ← NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
```

---

## User Flows

### Flow 1 — Seller Lists a Domain

```
1. Lands on homepage
2. Clicks "List Your Domain" → redirected to /sign-in
3. Signs in with Google or GitHub (one click, SSO)
4. Redirected to /dashboard/listings/new
5. Fills in:
   - Domain name (e.g. coolbrand.com)
   - Asking price (optional)
   - Description
   - Category
   - Contact email
6. Submits → listing created with status: pending_verification
7. Sees verification instructions page:
   "Add this TXT record to your DNS provider:"
   domainmarket-verify=abc123-uuid-here
8. Goes to their DNS provider (GoDaddy, Namecheap, Cloudflare, etc.)
9. Adds the TXT record
10. Returns to dashboard, clicks "Check Verification"
11. App calls Google DNS API → finds the TXT record
12. Status updates to: verified
13. Listing is now live on /listings (publicly visible)
```

### Flow 2 — Buyer Discovers a Domain

```
1. Lands on homepage → sees recent verified listings
2. Clicks "Browse All" → goes to /listings
3. Searches by name or filters by category / price
4. Clicks on a domain card → /listings/[id]
5. Sees: domain name, asking price, description, category
6. Sees seller's contact email
7. Emails seller directly to negotiate / arrange purchase
```

### Flow 3 — Seller Manages Listings

```
1. Signs in → goes to /dashboard
2. Sees all their listings with status badges:
   - pending_verification (yellow)
   - verified (green)
   - sold (blue)
   - removed (gray)
3. Can:
   - Click into a listing to see verification status
   - Edit price / description / contact email
   - Mark as sold (removes from public browse)
   - Remove listing entirely
```

### Flow 4 — Verification Fails

```
1. Seller clicks "Check Verification"
2. App does DNS lookup → TXT record not found yet
3. Shows: "TXT record not found yet. DNS can take up to 48hrs to propagate. Try again soon."
4. Status stays: pending_verification
5. Seller tries again later
```

---

## DNS Verification — How It Works

We use **Google's DNS-over-HTTPS API** — completely free, no API key required.

**API call:**
```
GET https://dns.google/resolve?name=example.com&type=TXT
```

**Response contains all TXT records for the domain. We check if any of them match:**
```
domainmarket-verify=<verify_token_from_db>
```

**If match found:** update `listings.status` to `verified`
**If no match:** return error message, status unchanged

This is the exact same method used by Google Search Console, Vercel, and Cloudflare to verify domain ownership.

---

## 2hr Build Timeline

| Time | Task | Deliverable |
|---|---|---|
| 0:00–0:20 | `npx create-next-app@latest` + Tailwind + shadcn/ui init | Running local app |
| 0:20–0:40 | Supabase: create project, run schema.sql, enable Google + GitHub OAuth | Auth + DB ready |
| 0:40–1:00 | Sign-in page (SSO buttons) + middleware auth guard + Supabase clients | Users can log in |
| 1:00–1:20 | Create listing form + dashboard listings page + verification instructions page | Sellers can list |
| 1:20–1:40 | `/api/verify/[id]` DNS lookup route + Check Verification button | Verification works |
| 1:40–2:00 | Public browse page + detail page + Vercel deploy + env vars | Live and shipped |

---

## Environment Variables Needed

```env
NEXT_PUBLIC_SUPABASE_URL=       # from Supabase project settings
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # from Supabase project settings
```

That's it. No Stripe keys. No email service keys. No secrets beyond Supabase.

---

## Supabase Setup Checklist

- [ ] Create new Supabase project
- [ ] Run `supabase/schema.sql` in SQL editor
- [ ] Enable Google OAuth provider (needs Google Cloud Console OAuth app)
- [ ] Enable GitHub OAuth provider (needs GitHub OAuth app)
- [ ] Add Vercel deploy URL to Supabase Auth redirect URLs

---

## Post-MVP Ideas (Do Not Build Now)

- Stripe payments + escrow
- Offers / counter-offers
- Auction listings with countdown
- Email notifications (listing verified, buyer contacted)
- Seller reputation / reviews
- Featured listing upsells
- Admin dashboard
- Domain transfer status tracking
