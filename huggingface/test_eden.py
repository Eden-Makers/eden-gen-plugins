import io
import json
import unittest
import urllib.error
from unittest import mock

import eden


class FakeResponse:
    def __init__(self, payload, status=200):
        self.payload = payload
        self.status = status

    def read(self):
        return json.dumps(self.payload).encode()

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False


class EdenTests(unittest.TestCase):
    def test_confirm_creates_once_and_polls(self):
        calls = []

        def opener(req, timeout=60):
            calls.append((req.method, req.full_url))
            if req.full_url.endswith("/estimate"):
                return FakeResponse({"usd_total": 0.04, "can_run": True, "needs_confirmation": True, "blockers": []})
            if req.full_url.endswith("/takes") and req.method == "POST":
                body = json.loads(req.data.decode())
                self.assertTrue(body["confirm_cost"])
                self.assertIn("idempotency-key", {key.lower(): value for key, value in req.headers.items()})
                return FakeResponse({"id": "take1", "status": "queued"})
            if req.full_url.endswith("/takes/take1"):
                return FakeResponse({"id": "take1", "status": "succeeded", "output": {"url": "https://media.edengen.ai/a.png", "mime_type": "image/png"}})
            raise AssertionError(req.full_url)

        seen = []
        take = eden.generate(
            "tkp_testtokenvalue",
            "image",
            "A glacier",
            "1:1",
            confirm=lambda price: seen.append(price.describe()) or True,
            opener=opener,
            sleep=lambda _seconds: None,
        )
        self.assertEqual(take.output_url, "https://media.edengen.ai/a.png")
        self.assertIn("$0.04", seen[0])
        posts = [item for item in calls if item[0] == "POST" and item[1].endswith("/takes")]
        self.assertEqual(len(posts), 1)

    def test_decline_does_not_create(self):
        def opener(req, timeout=60):
            if not req.full_url.endswith("/estimate"):
                raise AssertionError("create was called")
            return FakeResponse({"usd_total": 1, "can_run": True, "needs_confirmation": False})

        with self.assertRaises(eden.Cancelled):
            eden.generate("tkp_testtokenvalue", "image", "x", "1:1", confirm=lambda _price: False, opener=opener, sleep=lambda _s: None)

    def test_http_error_uses_the_server_message(self):
        def opener(req, timeout=60):
            raise urllib.error.HTTPError(req.full_url, 400, "bad", hdrs=None, fp=io.BytesIO(b'{"error":{"message":"Unknown model.","code":"unknown_model"}}'))

        with self.assertRaises(eden.EdenGenError) as caught:
            eden.estimate("tkp_testtokenvalue", "nope", "x", "1:1", opener=opener)
        self.assertEqual(str(caught.exception), "Unknown model.")


if __name__ == "__main__":
    unittest.main()
