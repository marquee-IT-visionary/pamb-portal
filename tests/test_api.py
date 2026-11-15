import json, os, tempfile, threading, unittest, urllib.request, urllib.error
from http.server import ThreadingHTTPServer

os.environ["PAMB_DB"] = os.path.join(tempfile.mkdtemp(), "t.db")
import server  # noqa: E402

server.DB_PATH = os.environ["PAMB_DB"]


class T(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        server.init_db()
        cls.srv = ThreadingHTTPServer(("127.0.0.1", 0), server.H)
        cls.srv.is_https = False
        threading.Thread(target=cls.srv.serve_forever, daemon=True).start()
        cls.base = "http://127.0.0.1:%d" % cls.srv.server_port

    @classmethod
    def tearDownClass(cls):
        cls.srv.shutdown()

    def call(self, method, path, body=None):
        req = urllib.request.Request(self.base + path, method=method, data=json.dumps(body).encode() if body is not None else None, headers={"Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(req) as r:
                return r.status, json.loads(r.read())
        except urllib.error.HTTPError as e:
            return e.code, json.loads(e.read())

    def test_create_assigns_pre_gate_id_and_links_asset_risk(self):
        s, p = self.call("POST", "/api/projects", {"name": "Test Bridge", "assetId": "BIS-1234", "riskId": "JIRA-231"})
        self.assertEqual(s, 201)
        self.assertTrue(p["preGateId"].startswith("PRE-"))
        self.assertEqual(p["gate"], "Pre-Gate0")
        self.assertEqual(p["audit"][0]["action"], "Created")

    def test_sap_id_added_later_keeps_pre_id_and_audits(self):
        _, p = self.call("POST", "/api/projects", {"name": "X"})
        p["sapId"], p["gate"] = "PROJ-777001", "Gate 1"
        s, u = self.call("PUT", "/api/projects/%d" % p["id"], p)
        self.assertEqual(s, 200)
        self.assertEqual(u["preGateId"], p["preGateId"])
        self.assertTrue(any(a["field"] == "sapId" for a in u["audit"]))
        s, hit = self.call("GET", "/api/projects?q=PROJ-777001")
        self.assertEqual(hit["total"], 1)

    def test_validation(self):
        self.assertEqual(self.call("POST", "/api/projects", {"name": ""})[0], 400)
        self.assertEqual(self.call("POST", "/api/projects", {"name": "a", "sapId": "PROJ-777001"})[0], 400)  # SAP id at Pre-Gate0
        self.assertEqual(self.call("POST", "/api/projects", {"name": "a", "riskId": "bad"})[0], 400)

    def test_search_filters(self):
        _, pre = self.call("GET", "/api/projects?stage=pre&size=100")
        _, gated = self.call("GET", "/api/projects?stage=gated&size=100")
        self.assertTrue(all(i["gate"] == "Pre-Gate0" for i in pre["items"]))
        self.assertTrue(all(i["gate"] != "Pre-Gate0" for i in gated["items"]))
        _, m = self.call("GET", "/api/projects?milestoneStatus=Achieved")
        self.assertGreater(m["total"], 0)
        _, m = self.call("GET", "/api/projects?milestone=Procurement")
        self.assertEqual(m["total"], 1)
        _, g = self.call("GET", "/api/projects?gate=Gate+2&status=Active")
        self.assertTrue(all(i["gate"] == "Gate 2" for i in g["items"]))

    def test_closure(self):
        _, p = self.call("POST", "/api/projects", {"name": "C"})
        s, u = self.call("POST", "/api/projects/%d/closure" % p["id"])
        self.assertEqual(u["status"], "Closure Initiated")

    def test_cost_validation_and_documents(self):
        self.assertFalse(self.call("POST", "/api/validate-cost", {"wbs": "bad"})[1]["ok"])
        self.assertTrue(self.call("POST", "/api/validate-cost", {"wbs": "12-34567"})[1]["ok"])
        _, p = self.call("POST", "/api/projects", {"name": "D"})
        p["financial"]["documents"] = [{"name": "a.exe", "size": 1}]
        self.assertEqual(self.call("PUT", "/api/projects/%d" % p["id"], p)[0], 400)


if __name__ == "__main__":
    unittest.main()
