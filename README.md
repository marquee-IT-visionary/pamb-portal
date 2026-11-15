# PAMB – Prioritization & Asset Management Portal (Transport for NSW)

Web portal for viewing, searching and managing asset projects from **Pre-Gate0** through **Gate 6**, based on the TfNSW PAMB Figma design. Python 3.9+ standard library only; SQLite storage.

## Run (HTTPS)
```
pip install cryptography        # only to auto-create a self-signed dev certificate
python server.py                # https://localhost:8443
```
Production options:
- Own certificate: `TLS_CERT=cert.pem TLS_KEY=key.pem PORT=443 python server.py`
- Behind a TLS-terminating proxy / load balancer / App Gateway (recommended on Azure/AWS): `PAMB_ALLOW_HTTP=1 PORT=8080 python server.py`, and have the proxy pass `X-Forwarded-User` (SSO identity, recorded in the audit log).
- `PAMB_DB` sets the SQLite path (default `data/pamb.db`). Tests: `python -m unittest discover -s tests`.

## Features
- Landing → tiles → Transport Assets → **Projects** (other tiles are stubs).
- Project list: quick search (name, IDs, asset, risk, milestone, PM…), Pre-Gate0 / Gate 1-6 selector, **Advanced Search** (Project ID, Asset ID, Risk ID, gate, status, milestone, milestone status, slippage, council grant, score, created/finish dates, PM, WBS…), sorting, paging, Export PDF (print).
- Create/edit project: **Pre-Gate0 ID (PRE-n) auto-assigned**; SAP ID (`PROJ-123456`) added later and both IDs shown. Linked Asset ID and Risk ID (e.g. JIRA-231).
- Tabs (every tab has **Cancel / Save**; closure button): Project (+ coordinates/map), Asset (details, in-flight/pipeline projects, grants), Benefits (5 stages, register, CSV load), Risk, Financial (funding, validate, milestones CSV + Gantt, documents), Schedule (main/sub tasks), Audit (field-level change log).

## Assumptions / not yet built
SAP, Jira, RiskHub, Entra SSO, the asset maintenance app and the survey are **simulated**; the map is a simple plot (no tile service); uploads accept CSV for processing (Excel files must be saved as CSV) and documents record metadata only; no role-based permissions; prioritization score is entered manually.
