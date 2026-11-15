"""PAMB portal server: REST API + static UI, HTTPS-capable, standard library only."""
import json, os, re, sqlite3, ssl, sys, threading, datetime, mimetypes
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

ROOT = os.path.dirname(os.path.abspath(__file__))
PUBLIC = os.path.join(ROOT, "public")
DB_PATH = os.environ.get("PAMB_DB", os.path.join(ROOT, "data", "pamb.db"))
LOCK = threading.Lock()
GATES = ["Pre-Gate0", "Gate 1", "Gate 2", "Gate 3", "Gate 4", "Gate 5", "Gate 6"]
STATUSES = ["Active", "On Hold", "Closure Initiated", "Closed", "Cancelled"]
MAX_DOC = 5 * 1024 * 1024
DOC_EXT = (".doc", ".docx", ".xls", ".xlsx", ".pdf")


def now():
    return datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")


def db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    c = sqlite3.connect(DB_PATH)
    c.row_factory = sqlite3.Row
    return c


def init_db():
    with LOCK, db() as c:
        c.execute("CREATE TABLE IF NOT EXISTS projects(id INTEGER PRIMARY KEY AUTOINCREMENT, doc TEXT NOT NULL)")
        c.execute("CREATE TABLE IF NOT EXISTS counters(name TEXT PRIMARY KEY, value INTEGER)")
        c.execute("INSERT OR IGNORE INTO counters VALUES('pre', 100)")
        if c.execute("SELECT COUNT(*) FROM projects").fetchone()[0] == 0:
            from seed import SEED
            for p in SEED:
                _insert(c, p, "system")


def next_pre(c):
    c.execute("UPDATE counters SET value=value+1 WHERE name='pre'")
    return "PRE-%d" % c.execute("SELECT value FROM counters WHERE name='pre'").fetchone()[0]


def blank(p):
    p.setdefault("name", "")
    p.setdefault("preGateId", "")
    p.setdefault("sapId", "")
    p.setdefault("assetType", "")
    p.setdefault("assetId", "")
    p.setdefault("riskId", "")
    p.setdefault("ministerialAgenda", "")
    p.setdefault("lat", "")
    p.setdefault("lng", "")
    p.setdefault("gate", "Pre-Gate0")
    p.setdefault("status", "Active")
    p.setdefault("pm", "")
    p.setdefault("score", 0)
    p.setdefault("p50", "")
    p.setdefault("p90", "")
    p.setdefault("forecastFinish", "")
    p.setdefault("createdDate", now()[:10])
    p.setdefault("councilGrant", False)
    p.setdefault("projectFocus", "")
    p.setdefault("wbs", "")
    p.setdefault("asset", {"name": "", "location": "", "lga": "", "description": "", "details": ""})
    p.setdefault("benefits", {"stages": {}, "items": []})
    p.setdefault("risk", {"title": "", "category": "", "owner": "", "created": "", "due": "", "status": "", "action": "", "commentary": ""})
    p.setdefault("financial", {"projectCode": "", "workOrder": "", "wbs": "", "purchaseOrder": "", "totalFunding": 0, "fy": "", "spent": 0, "milestones": [], "documents": []})
    p.setdefault("schedule", [])
    p.setdefault("audit", [])
    return p


def validate(p):
    errs = []
    if not str(p.get("name", "")).strip():
        errs.append("Project Name is required.")
    if p.get("gate") not in GATES:
        errs.append("Invalid gate.")
    if p.get("status") not in STATUSES:
        errs.append("Invalid status.")
    if p.get("sapId") and not re.fullmatch(r"PROJ-\d{4,}", p["sapId"]):
        errs.append("Gated Project ID must look like PROJ-123456.")
    if p.get("sapId") and p.get("gate") == "Pre-Gate0":
        errs.append("A project with a SAP ID cannot be at Pre-Gate0; select Gate 1-6.")
    if p.get("riskId") and not re.fullmatch(r"[A-Z]+-\d+", p["riskId"]):
        errs.append("Risk ID must look like JIRA-231.")
    for k in ("p50", "p90", "forecastFinish"):
        if p.get(k) and not re.fullmatch(r"\d{4}-\d{2}-\d{2}", p[k]):
            errs.append("%s must be YYYY-MM-DD." % k)
    for d in p.get("financial", {}).get("documents", []):
        if not d.get("name", "").lower().endswith(DOC_EXT):
            errs.append("Document %s: only Word, Excel or PDF allowed." % d.get("name"))
        if d.get("size", 0) > MAX_DOC:
            errs.append("Document %s exceeds 5MB." % d.get("name"))
    return errs


def derive(p):
    p["slippage"] = bool(p.get("p50") and p.get("p90") and p["p90"] > p["p50"] and p.get("forecastFinish") and p["forecastFinish"] > p["p50"])
    return p


def _row(r):
    p = json.loads(r["doc"])
    p["id"] = r["id"]
    return p


def _insert(c, p, user):
    blank(p)
    if not p["preGateId"]:
        p["preGateId"] = next_pre(c)
    derive(p)
    p["audit"] = [{"at": now(), "user": user, "action": "Created", "field": "", "from": "", "to": ""}]
    cur = c.execute("INSERT INTO projects(doc) VALUES(?)", (json.dumps(p),))
    p["id"] = cur.lastrowid
    return p


def flat(d, prefix=""):
    out = {}
    if isinstance(d, dict):
        for k, v in d.items():
            out.update(flat(v, prefix + k + "."))
    elif isinstance(d, list):
        out[prefix[:-1]] = json.dumps(d, sort_keys=True)
    else:
        out[prefix[:-1]] = d
    return out


def diff(old, new, user):
    o, n = flat({k: v for k, v in old.items() if k not in ("audit", "id", "slippage")}), flat({k: v for k, v in new.items() if k not in ("audit", "id", "slippage")})
    ev = []
    for k in sorted(set(o) | set(n)):
        if o.get(k) != n.get(k):
            short = lambda v: "(list updated)" if isinstance(v, str) and v.startswith("[") else v
            ev.append({"at": now(), "user": user, "action": "Updated", "field": k, "from": short(o.get(k, "")), "to": short(n.get(k, ""))})
    return ev


def list_projects(q):
    with LOCK, db() as c:
        rows = [_row(r) for r in c.execute("SELECT id, doc FROM projects ORDER BY id")]
    g = lambda k: (q.get(k, [""])[0]).strip()
    kw = g("q").lower()
    res = []
    for p in rows:
        fin = p["financial"]
        ms = " ".join("%s %s" % (m.get("name", ""), m.get("status", "")) for m in fin.get("milestones", []))
        tasks = " ".join(t.get("title", "") for t in p.get("schedule", []))
        hay = " ".join(str(x) for x in (p["name"], p["preGateId"], p["sapId"], p["assetId"], p["riskId"], p["assetType"], p["pm"], p["gate"], p["status"], ms, tasks)).lower()
        if kw and kw not in hay:
            continue
        if g("stage") == "pre" and p["gate"] != "Pre-Gate0":
            continue
        if g("stage") == "gated" and p["gate"] == "Pre-Gate0":
            continue
        checks = [("gate", "gate"), ("status", "status"), ("assetType", "assetType")]
        if any(g(a) and g(a) != p[b] for a, b in checks):
            continue
        subs = [("projectId", p["preGateId"] + " " + p["sapId"]), ("assetId", p["assetId"]), ("riskId", p["riskId"]), ("pm", p["pm"]), ("wbs", p["wbs"] + " " + fin.get("wbs", "")), ("projectFocus", p["projectFocus"]), ("milestone", ms), ("name", p["name"])]
        if any(g(a) and g(a).lower() not in b.lower() for a, b in subs):
            continue
        if g("milestoneStatus") and not any(m.get("status") == g("milestoneStatus") for m in fin.get("milestones", [])):
            continue
        if g("councilGrant") and str(p["councilGrant"]).lower() != g("councilGrant").lower():
            continue
        if g("slippage") and str(p["slippage"]).lower() != g("slippage").lower():
            continue
        if g("minScore") and float(p["score"] or 0) < float(g("minScore")):
            continue
        if g("createdFrom") and p["createdDate"] < g("createdFrom"):
            continue
        if g("createdTo") and p["createdDate"] > g("createdTo"):
            continue
        if g("finishBefore") and (not p["forecastFinish"] or p["forecastFinish"] > g("finishBefore")):
            continue
        res.append(p)
    sort = g("sort") or "id"
    res.sort(key=lambda p: (p.get(sort) is None, str(p.get(sort, "")).lower() if sort != "score" and sort != "id" else p.get(sort, 0)), reverse=g("dir") == "desc")
    total = len(res)
    size = max(1, min(100, int(g("size") or 10)))
    page = max(1, int(g("page") or 1))
    items = res[(page - 1) * size: page * size]
    slim = [{k: p[k] for k in ("id", "name", "preGateId", "sapId", "assetType", "assetId", "riskId", "p50", "p90", "slippage", "gate", "status", "pm", "score", "forecastFinish")} for p in items]
    return {"total": total, "page": page, "size": size, "items": slim}


class H(BaseHTTPRequestHandler):
    server_version = "PAMB/1.0"

    def log_message(self, fmt, *a):
        sys.stderr.write("%s %s\n" % (self.address_string(), fmt % a))

    def send_json(self, code, obj, headers=None):
        b = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(b)))
        self.security()
        self.end_headers()
        self.wfile.write(b)

    def security(self):
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "DENY")
        self.send_header("Referrer-Policy", "same-origin")
        if self.server.is_https:
            self.send_header("Strict-Transport-Security", "max-age=31536000; includeSubDomains")

    def user(self):
        return self.headers.get("X-Forwarded-User") or os.environ.get("PAMB_USER", "C James")

    def body(self):
        n = int(self.headers.get("Content-Length") or 0)
        if n > 25 * 1024 * 1024:
            raise ValueError("Request too large")
        return json.loads(self.rfile.read(n) or b"{}")

    def do_GET(self):
        u = urlparse(self.path)
        q = parse_qs(u.query)
        try:
            if u.path == "/api/meta":
                return self.send_json(200, {"gates": GATES, "statuses": STATUSES, "user": self.user()})
            if u.path == "/api/health":
                return self.send_json(200, {"ok": True})
            if u.path == "/api/projects":
                return self.send_json(200, list_projects(q))
            m = re.fullmatch(r"/api/projects/(\d+)", u.path)
            if m:
                with LOCK, db() as c:
                    r = c.execute("SELECT id, doc FROM projects WHERE id=?", (m.group(1),)).fetchone()
                return self.send_json(200, _row(r)) if r else self.send_json(404, {"errors": ["Not found"]})
            if u.path.startswith("/api/"):
                return self.send_json(404, {"errors": ["Not found"]})
        except Exception as e:  # noqa
            return self.send_json(500, {"errors": [str(e)]})
        self.static(u.path)

    def static(self, path):
        path = "/index.html" if path in ("/", "") else path
        full = os.path.normpath(os.path.join(PUBLIC, path.lstrip("/")))
        if not full.startswith(PUBLIC) or not os.path.isfile(full):
            self.send_response(404)
            self.end_headers()
            return
        data = open(full, "rb").read()
        self.send_response(200)
        self.send_header("Content-Type", mimetypes.guess_type(full)[0] or "application/octet-stream")
        self.send_header("Content-Length", str(len(data)))
        self.security()
        self.end_headers()
        self.wfile.write(data)

    def do_POST(self):
        u = urlparse(self.path)
        try:
            if u.path == "/api/projects":
                p = self.body()
                for k in ("id", "audit", "preGateId", "sapId"):
                    if k == "sapId":
                        continue
                    p.pop(k, None)
                errs = validate(blank(p))
                if errs:
                    return self.send_json(400, {"errors": errs})
                with LOCK, db() as c:
                    p = _insert(c, p, self.user())
                return self.send_json(201, p)
            m = re.fullmatch(r"/api/projects/(\d+)/closure", u.path)
            if m:
                return self.update(m.group(1), lambda old: dict(old, status="Closure Initiated"), "Closure initiated")
            if u.path == "/api/validate-cost":
                b = self.body()
                ok = bool(re.fullmatch(r"\d{2}-\d{5,}", b.get("wbs", ""))) and (not b.get("projectCode") or b["projectCode"] == b.get("sapId") or not b.get("sapId"))
                return self.send_json(200, {"ok": ok, "message": "Validation successful." if ok else "Validation Failed. WBS Code does not match."})
            self.send_json(404, {"errors": ["Not found"]})
        except ValueError as e:
            self.send_json(400, {"errors": [str(e)]})
        except Exception as e:  # noqa
            self.send_json(500, {"errors": [str(e)]})

    def do_PUT(self):
        m = re.fullmatch(r"/api/projects/(\d+)", urlparse(self.path).path)
        if not m:
            return self.send_json(404, {"errors": ["Not found"]})
        try:
            new = self.body()
            self.update(m.group(1), lambda old: dict(new, id=old["id"], preGateId=old["preGateId"], audit=old["audit"], createdDate=old["createdDate"]))
        except ValueError as e:
            self.send_json(400, {"errors": [str(e)]})

    def update(self, pid, fn, action=None):
        with LOCK, db() as c:
            r = c.execute("SELECT id, doc FROM projects WHERE id=?", (pid,)).fetchone()
            if not r:
                return self.send_json(404, {"errors": ["Not found"]})
            old = _row(r)
            new = derive(blank(fn(old)))
            errs = validate(new)
            if errs:
                return self.send_json(400, {"errors": errs})
            ev = diff(old, new, self.user())
            if action:
                ev = [{"at": now(), "user": self.user(), "action": action, "field": "status", "from": old["status"], "to": new["status"]}]
            new["audit"] = old["audit"] + ev
            c.execute("UPDATE projects SET doc=? WHERE id=?", (json.dumps(new), pid))
        self.send_json(200, new)


def make_cert(cert, key):
    try:
        from cryptography import x509
        from cryptography.x509.oid import NameOID
        from cryptography.hazmat.primitives import hashes, serialization
        from cryptography.hazmat.primitives.asymmetric import rsa
        import ipaddress
    except ImportError:
        return False
    k = rsa.generate_private_key(65537, 2048)
    name = x509.Name([x509.NameAttribute(NameOID.COMMON_NAME, "localhost")])
    t = datetime.datetime.now(datetime.timezone.utc)
    crt = (x509.CertificateBuilder().subject_name(name).issuer_name(name).public_key(k.public_key())
           .serial_number(x509.random_serial_number()).not_valid_before(t).not_valid_after(t + datetime.timedelta(days=365))
           .add_extension(x509.SubjectAlternativeName([x509.DNSName("localhost"), x509.IPAddress(ipaddress.ip_address("127.0.0.1"))]), False)
           .sign(k, hashes.SHA256()))
    os.makedirs(os.path.dirname(cert), exist_ok=True)
    open(cert, "wb").write(crt.public_bytes(serialization.Encoding.PEM))
    open(key, "wb").write(k.private_bytes(serialization.Encoding.PEM, serialization.PrivateFormat.TraditionalOpenSSL, serialization.NoEncryption()))
    return True


def main():
    init_db()
    host = os.environ.get("HOST", "0.0.0.0")
    cert, key = os.environ.get("TLS_CERT"), os.environ.get("TLS_KEY")
    insecure = os.environ.get("PAMB_ALLOW_HTTP") == "1"  # use behind a TLS-terminating proxy
    if not cert and not insecure:
        cert, key = os.path.join(ROOT, "certs", "dev.crt"), os.path.join(ROOT, "certs", "dev.key")
        if not os.path.exists(cert) and not make_cert(cert, key):
            sys.exit("No TLS_CERT/TLS_KEY set and 'cryptography' not installed for a dev cert. "
                     "Set TLS_CERT/TLS_KEY, `pip install cryptography`, or set PAMB_ALLOW_HTTP=1 behind a TLS proxy.")
    port = int(os.environ.get("PORT", "8443" if not insecure else "8080"))
    srv = ThreadingHTTPServer((host, port), H)
    srv.is_https = not insecure
    if not insecure:
        ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        ctx.minimum_version = ssl.TLSVersion.TLSv1_2
        ctx.load_cert_chain(cert, key)
        srv.socket = ctx.wrap_socket(srv.socket, server_side=True)
    print("PAMB portal on %s://%s:%d" % ("https" if srv.is_https else "http", host, port))
    srv.serve_forever()


if __name__ == "__main__":
    main()
