# Tres Amigos admin

De admin staat bewust apart van de publieke pagina's:

- `admin/index.html` bevat de admin shell en sidebar-panels.
- `admin/admin.js` regelt login, tabs, formulieren en opslaan.
- `server.cjs` serveert `/admin` en de `/api/admin/*` routes.
- `data/site-content.json` bevat de beheerbare content.

Beschikbare secties:

- Overzicht
- Home & knoppen
- Vestigingen
- Video's
- Footer
- API

De publieke website leest dezelfde content via `cms.js` en `/api/content`.
