-- Order book for quote requests. Apply with:
--   npx wrangler d1 execute buitenzorg-orders --remote --file db/schema.sql
CREATE TABLE IF NOT EXISTS inquiries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ref TEXT NOT NULL UNIQUE,                 -- human reference, e.g. Q-2026-0001
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  status TEXT NOT NULL DEFAULT 'new',       -- pipeline stage, see STAGES in functions/api/admin/_lib.js
  source TEXT NOT NULL DEFAULT 'website',   -- website | email | whatsapp | manual
  lang TEXT,                                -- page language the buyer used
  name TEXT NOT NULL,
  company TEXT NOT NULL,
  email TEXT NOT NULL,
  country TEXT NOT NULL,
  buyer_type TEXT,
  items_text TEXT,                          -- free text from the form
  message TEXT,
  quote_json TEXT,                          -- [{sku, qty}] from the load plan
  notes TEXT,                               -- internal notes
  page TEXT,
  ip TEXT,
  cf_country TEXT,
  delivered INTEGER NOT NULL DEFAULT 0      -- 1 if the notification email was sent
);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_created ON inquiries(created_at DESC);

-- Status history / audit trail
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  inquiry_id INTEGER NOT NULL REFERENCES inquiries(id) ON DELETE CASCADE,
  at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  actor TEXT,                               -- email of the admin, or 'system'
  kind TEXT NOT NULL,                       -- created | status | note
  from_status TEXT,
  to_status TEXT,
  note TEXT
);
CREATE INDEX IF NOT EXISTS idx_events_inquiry ON events(inquiry_id, at);
