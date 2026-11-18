# PAMB – Prioritization & Asset Management Portal (interactive demo)

Technology-agnostic interactive demo of the TfNSW PAMB wireframes. Plain HTML/CSS/JS, no build step, no backend; data is mock and stored in the browser (localStorage). Intended as a visual/behavioural reference for a later Java/React/Pega/Power Apps build.

Run locally: serve the `site/` folder, e.g. `python -m http.server -d site 8080`.
Deployed to GitHub Pages from `site/` via `.github/workflows/pages.yml`.

Demo login accepts any credentials. Map tiles © OpenStreetMap contributors (Leaflet).

Assets: menu Assets > List of Assets (ID, title, View/Edit). Projects pick an existing asset (searchable by ID/title) and an asset page links/unlinks projects, with picture, coordinates, suburb/state/postcode and closest intersection. Asset data is mock, stored in localStorage.
