# OutboundAI

> 🚀 Autonomous B2B sales agent powered by AI - from lead discovery to meeting booking

## 📹 Demo Video
[Watch the demo video](link-to-your-video)

## 🎯 Problem Statement

B2B sales teams spend 70% of their time on repetitive tasks:
- **Manual Lead Research**: Hours searching for prospects
- **Generic Outreach**: Low response rates from templated emails
- **Follow-up Fatigue**: Tracking conversations across channels
- **Scheduling Overhead**: Back-and-forth to book meetings

**OutboundAI solves this** by creating a fully autonomous sales pipeline that handles lead discovery, qualification, personalized outreach, inbox management, and meeting booking - all powered by AI.

---

## ✨ Features

### 🎯 Intelligent Lead Discovery
- Automated Google Search with smart query generation
- Industry-specific targeting (SaaS, E-commerce, Healthcare, etc.)
- Location and company size filtering
- Quality filters (excludes job boards, government sites, big tech)

### 🤖 AI-Powered Qualification
- Gemini 2.5 Flash analyzes website content
- Scores leads 0-100 based on ICP fit
- Extracts tech stack and company signals
- Lenient scoring for startups and early-stage companies

### ✉️ Personalized Outreach
- Context-aware email generation
- Editable drafts before sending
- Professional templates
- Automated sending via Resend

### 📥 Smart Inbox Management
- Gmail integration for reply tracking
- AI sentiment analysis (Positive, Objection, OOO)
- Thread-based conversation view
- Action-required filtering

### 📅 Automated Meeting Booking
- AI detects meeting intent from replies
- Google Calendar integration
- One-click booking from inbox
- Automatic calendar invites with Google Meet links

### 🔐 Secure Authentication
- Supabase Auth integration
- Protected routes
- User-specific campaigns and data

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Database:** Supabase (PostgreSQL)
- **AI:** Google Gemini 2.5 Flash
- **Styling:** Tailwind CSS
- **Email:** Resend
- **Calendar:** Google Calendar API
- **Inbox:** Gmail API
- **Auth:** Supabase Auth

## 🚀 Getting Started

### Prerequisites

You'll need API keys for the following services:

1. **Supabase** - Database and authentication
2. **Google Gemini** - AI qualification and email generation
3. **Google Custom Search** - Lead discovery
4. **Google Cloud** - Gmail and Calendar APIs
5. **Resend** - Email sending

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/outboundai.git
   cd outboundai
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   
   Create a `.env` file in the root directory:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # Google Gemini AI
   GEMINI_API_KEY=your_gemini_api_key

   # Google Custom Search
   GOOGLE_SEARCH_API_KEY=your_google_search_api_key
   GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id

   # Google OAuth (Gmail & Calendar)
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_REFRESH_TOKEN=your_google_refresh_token

   # Resend (Email Sending)
   RESEND_API_KEY=your_resend_api_key
   RESEND_FROM_EMAIL=your_verified_sender_email

   # Optional
   MAX_LEADS_PER_CAMPAIGN=100
   ```

4. **Set up Supabase database:**
   
   Run the migration in your Supabase SQL Editor:
   ```bash
   # Located in: supabase/migrations/
   ```

5. **Configure Google OAuth:**
   
   For Gmail and Calendar integration, you need to:
   - Create a Google Cloud project
   - Enable Gmail API and Calendar API
   - Create OAuth 2.0 credentials
   - Generate a refresh token with scopes:
     - `https://www.googleapis.com/auth/gmail.readonly`
     - `https://www.googleapis.com/auth/gmail.send`
     - `https://www.googleapis.com/auth/calendar`
   
   Use the script in `scripts/auth-google.js` to generate your refresh token.

6. **Run the development server:**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
outboundai/
├── src/
│   ├── app/
│   │   ├── auth/              # Authentication actions
│   │   ├── dashboard/         # Main dashboard
│   │   │   └── components/    # Dashboard components
│   │   ├── login/             # Login page
│   │   ├── signup/            # Signup page
│   │   └── actions.ts         # Server actions
│   │
│   ├── lib/
│   │   ├── services/          # External service integrations
│   │   │   ├── calendar.ts    # Google Calendar
│   │   │   ├── gemini-agent.ts # AI qualification
│   │   │   ├── gmail-sync.ts  # Gmail integration
│   │   │   ├── google-search.ts # Lead discovery
│   │   │   ├── resend.ts      # Email sending
│   │   │   └── scraper.ts     # Website scraping
│   │   ├── supabase/          # Database client
│   │   └── utils/             # Helper functions
│   │
│   ├── types/                 # TypeScript definitions
│   └── middleware.ts          # Route protection
│
├── supabase/                  # Database migrations
├── scripts/                   # Utility scripts
└── public/                    # Static assets
```

## 🎯 How It Works

1. **Create a Campaign**
   - Define your Ideal Customer Profile (ICP)
   - Set target industry, location, and company size
   - Specify your value proposition

2. **Automated Discovery**
   - AI generates optimized search queries
   - Discovers 30+ potential leads per campaign
   - Filters out irrelevant results

3. **AI Qualification**
   - Scrapes company websites
   - Analyzes content with Gemini
   - Scores leads 0-100 on ICP fit
   - Generates personalized email drafts

4. **Smart Outreach**
   - Review and edit AI-generated emails
   - Send with one click
   - Track delivery status

5. **Inbox Management**
   - Auto-syncs Gmail replies
   - AI analyzes sentiment
   - Surfaces action-required threads

6. **Meeting Booking**
   - AI detects meeting intent
   - One-click booking from inbox
   - Auto-creates Google Calendar events
   - Sends confirmation emails

## 🔑 Key Features

### Lead Pipeline Filters
- Filter by AI score (High: 80-100, Medium: 50-79, Low: <50)
- Filter by status (Discovered, Qualified, Contacted, Replied, etc.)
- Export filtered leads to CSV

### Live Agent Logs
- Real-time campaign progress tracking
- Emoji-enhanced status updates
- Detailed step-by-step visibility

### Editable Email Drafts
- Modify AI-generated content
- Update recipient email
- Save changes before sending

## 🐛 Known Issues

### Gmail API Scopes
If you see "insufficient authentication scopes" errors:
1. Regenerate your Google OAuth refresh token
2. Ensure it includes all required scopes (see setup above)
3. Update `GOOGLE_REFRESH_TOKEN` in `.env`

### Network Timeouts
Occasional Supabase connection timeouts may occur due to:
- Slow internet connection
- Firewall restrictions
- ISP throttling

The application handles these gracefully with retries.

## 📝 License

MIT

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For issues or questions, please open an issue on GitHub.

---

**Built with ❤️ using Next.js, Supabase, and Google Gemini**
