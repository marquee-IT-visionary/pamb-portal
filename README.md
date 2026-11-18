# PAMB – Prioritization & Asset Management Portal (interactive demo)

Technology-agnostic interactive demo of the TfNSW PAMB wireframes. Plain HTML/CSS/JS, no build step, no backend; data is mock and stored in the browser (localStorage). Intended as a visual/behavioural reference for a later Java/React/Pega/Power Apps build.

Run locally: serve the `site/` folder, e.g. `python -m http.server -d site 8080`.
Deployed to GitHub Pages from `site/` via `.github/workflows/pages.yml`.

Demo login accepts any credentials. Map tiles © OpenStreetMap contributors (Leaflet).

Assets: menu Assets > List of Assets (ID, title, View/Edit). Projects pick an existing asset (searchable by ID/title) and an asset page links/unlinks projects, with picture, coordinates, suburb/state/postcode and closest intersection. Asset data is mock, stored in localStorage.

Asset list shows ID, type (Roads/Bridges), title, location and suburb. Asset and project Asset tabs share Details / Projects (In-Flight and Future, linkable to both) / Grants views.

- Projects start with a Pre-Gate ID only; ticking *All pre-requisites complete* reveals the Gated Project ID. Risks RISK-1..5 can be linked to projects and assets. Sample Pre-Gate-1..3 and PROJ-111..113 are linked to assets.
