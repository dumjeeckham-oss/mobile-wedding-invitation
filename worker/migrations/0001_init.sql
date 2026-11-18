PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS logo_assets (
  logo_asset_id TEXT PRIMARY KEY,
  organization_id TEXT,
  storage_key TEXT NOT NULL UNIQUE,
  mime_type TEXT NOT NULL CHECK (mime_type IN ('image/png','image/jpeg','image/webp')),
  byte_size INTEGER NOT NULL CHECK (byte_size > 0 AND byte_size <= 2097152),
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  sha256 TEXT NOT NULL,
  external_url TEXT,
  created_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS organizations (
  organization_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  logo_asset_id TEXT REFERENCES logo_assets(logo_asset_id),
  logo_source_type TEXT NOT NULL DEFAULT 'none' CHECK (logo_source_type IN ('upload','url','none')),
  logo_external_url TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS events (
  event_id TEXT PRIMARY KEY,
  organization_id TEXT REFERENCES organizations(organization_id),
  custom_logo_asset_id TEXT REFERENCES logo_assets(logo_asset_id),
  logo_source_type TEXT NOT NULL DEFAULT 'none' CHECK (logo_source_type IN ('upload','url','none')),
  logo_external_url TEXT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  event_type TEXT NOT NULL,
  host TEXT NOT NULL,
  intro TEXT NOT NULL DEFAULT '',
  event_datetime TEXT,
  venue TEXT,
  address TEXT,
  coordinates_json TEXT,
  transportation_info TEXT,
  parking_info TEXT,
  map_settings_json TEXT NOT NULL DEFAULT '{}',
  video_url TEXT,
  video_title TEXT,
  gallery_json TEXT NOT NULL DEFAULT '[]',
  font_settings_json TEXT NOT NULL DEFAULT '{}',
  theme_settings_json TEXT NOT NULL DEFAULT '{}',
  sections_json TEXT NOT NULL DEFAULT '{}',
  logo_position TEXT NOT NULL DEFAULT 'hidden',
  logo_size TEXT NOT NULL DEFAULT 'medium',
  logo_visible INTEGER NOT NULL DEFAULT 0,
  publication_status TEXT NOT NULL DEFAULT 'draft' CHECK (publication_status IN ('draft','private','public','trash')),
  deleted_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_events_public_slug ON events(slug, publication_status, deleted_at);
CREATE INDEX IF NOT EXISTS idx_events_organization ON events(organization_id, deleted_at);
