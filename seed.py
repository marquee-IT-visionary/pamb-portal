"""Sample data, loaded only when the database is empty."""

STAGES = ["Identification", "Analysis & Planning", "Delivery", "Transition", "Sustainment"]


def _stages(done):
    return {s: {"notes": "", "status": "green" if i < done else "red"} for i, s in enumerate(STAGES)}


def _p(name, pre, sap, atype, aid, rid, gate, status, pm, score, p50, p90, ff, lat, lng, ms, tasks, funding, spent, grant=False):
    return {
        "name": name, "preGateId": pre, "sapId": sap, "assetType": atype, "assetId": aid, "riskId": rid,
        "ministerialAgenda": "JIRA-12345", "gate": gate, "status": status, "pm": pm, "score": score,
        "p50": p50, "p90": p90, "forecastFinish": ff, "lat": lat, "lng": lng, "councilGrant": grant,
        "projectFocus": "Safety" if score >= 7 else "Renewal", "wbs": "12-34567",
        "asset": {"name": aid + " " + atype, "location": "Sydney NSW", "lga": "Parramatta", "description": "", "details": ""},
        "benefits": {"stages": _stages(2), "items": [{"ref": "B1", "name": "Reduced crash rate", "status": "On track", "rag": "Green", "target": "2027-06-30", "lead": pm}]},
        "risk": {"title": "Structural deterioration of " + aid, "category": "Safety", "owner": pm, "created": "2025-01-10", "due": "2026-03-31", "status": "Open", "action": "", "commentary": ""},
        "financial": {"projectCode": sap, "workOrder": "WO-1001", "wbs": "12-34567", "purchaseOrder": "PO-5521", "totalFunding": funding, "fy": "FY26", "spent": spent, "milestones": ms, "documents": []},
        "schedule": tasks,
    }


def _ms(*a):
    return [{"name": n, "start": s, "end": e, "status": st, "description": ""} for n, s, e, st in a]


def _t(title, s, e, subs=()):
    return {"title": title, "start": s, "end": e, "days": 0, "status": "NEW",
            "subtasks": [{"title": x, "start": s, "end": e, "status": "NEW"} for x in subs]}


SEED = [
    _p("Parramatta Rd Maint", "PRE-12", "PROJ-1234", "Road", "RDS-2201", "JIRA-231", "Gate 2", "Active", "John Doe", 7, "2025-12-12", "2026-02-25", "2026-03-10", -33.8150, 151.0011,
       _ms(("Concept approved", "2025-01-01", "2025-03-01", "Achieved"), ("Design complete", "2025-03-02", "2025-09-30", "In Progress"), ("Construction start", "2026-01-01", "2026-02-01", "Yet to be achieved")),
       [_t("Ideation", "2026-03-01", "2026-03-31", ["Concept Paper", "PSAD"]), _t("Design", "2026-04-01", "2026-06-30")], 750000, 550000, True),
    _p("Hawkesbury River Bridge Rehab", "PRE-23", "PROJ-123456", "Bridge", "BIS-9561", "RISKHUB-123", "Gate 3", "Active", "Jane Smith", 9, "2026-05-01", "2026-04-01", "2026-06-15",
       -33.5, 150.9, _ms(("Business case", "2025-02-01", "2025-06-01", "Achieved"), ("Procurement", "2025-07-01", "2026-01-31", "In Progress")),
       [_t("Development & Build", "2026-02-01", "2026-12-31", ["Development"])], 4200000, 1100000),
    _p("Pyrmont Bridge Bearing Replacement", "PRE-31", "", "Bridge", "BIS-1234", "JIRA-231", "Pre-Gate0", "Active", "Alex Lee", 6, "", "", "", -33.8719, 151.1995,
       _ms(("Options analysis", "2026-01-01", "2026-04-01", "In Progress")), [], 0, 0),
    _p("Newcastle Ferry Wharf Upgrade", "PRE-40", "", "Maritime", "MAR-0077", "JIRA-310", "Pre-Gate0", "On Hold", "Sam Wong", 4, "", "", "", -32.9272, 151.7765, [], [], 0, 0),
    _p("Illawarra Rail Culvert Renewal", "PRE-18", "PROJ-200045", "Rail", "RAL-3310", "JIRA-402", "Gate 5", "Active", "Priya Nair", 8, "2025-11-01", "2026-01-15", "2026-02-20", -34.42, 150.89,
       _ms(("Delivery", "2025-06-01", "2025-12-01", "Achieved"), ("Handover", "2026-01-01", "2026-02-01", "In Progress")), [], 900000, 870000),
    _p("Western Sydney Culvert Study", "PRE-44", "", "Road", "RDS-4410", "JIRA-455", "Pre-Gate0", "Active", "John Doe", 5, "", "", "", -33.75, 150.7, [], [], 0, 0),
]
