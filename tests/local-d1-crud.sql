INSERT INTO organizations (organization_id, name, created_at, updated_at)
VALUES ('org-test', '합성 운영팀', '2026-01-01', '2026-01-01');

INSERT INTO events (
  event_id, organization_id, slug, title, event_type, host, publication_status,
  map_settings_json, font_settings_json, theme_settings_json, sections_json,
  gallery_json, created_at, updated_at
) VALUES (
  'evt-test', 'org-test', 'synthetic-event', '합성 행사', '포럼', '합성 운영팀', 'draft',
  '{}', '{}', '{"backgroundPresetId":"navy-gold"}', '{}', '[]', '2026-01-01', '2026-01-01'
);

UPDATE events SET publication_status = 'public', updated_at = '2026-01-02'
WHERE event_id = 'evt-test';
