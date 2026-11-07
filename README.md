# AI Ops Team

AI agents that work like a full sales and operations department.

**Live prototype:** https://pielolvoyager-maker.github.io/ai-ops-team/

Six role-based agents work inside the tools a business already uses (Instagram, WhatsApp, CRM, calendars, Slack):

- **COLD** sends first messages and re-warms quiet leads
- **RESPOND** answers leads, newest first
- **BACKUP** answers the oldest waiting, so nobody waits
- **WHATSAPP** is the only agent on WhatsApp: confirmations and reminders
- **LABEL** tags and counts every lead and keeps the live numbers
- **CHECKUP** finds free slots, books qualified leads with closers, sends reminders 2 hours before calls and follows up on no-shows

They coordinate through a shared claim board, so a customer never gets two answers. When an agent is not sure, it asks the manager in a shared chat. The manager answers once and the answer becomes a rule every agent follows.

## The demo

- Play the lead in an Instagram-style chat (English or Gulf Arabic) and watch the team board react.
- Three endings: a booked call, the no-budget path, and an escalation where you answer as the manager.
- Run a full simulated day: 50 leads through all six agents at once.

From one live shift of the production system: 537 messages to 195 leads, 118 replied, 7 calls booked.

Prototype. The demo company and leads are fictional. The production system runs daily in a real business.

Built by Bilal Houssein. Plain static site (index.html, style.css, app.js). No build step, no tracking.
