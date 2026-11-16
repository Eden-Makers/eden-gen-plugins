import plistlib
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SHORTCUT = ROOT / "Eden-Gen-Imagine.shortcut"


class ShortcutTests(unittest.TestCase):
    def test_unsigned_shortcut_calls_the_api_and_has_no_token(self):
        data = plistlib.loads(SHORTCUT.read_bytes())
        self.assertEqual(data["WFWorkflowName"], "Eden Gen Imagine")
        blob = SHORTCUT.read_text()
        self.assertIn("https://edengen.ai/v1/estimate", blob)
        self.assertIn("https://edengen.ai/v1/takes", blob)
        self.assertNotIn("tkp_", blob)
        self.assertNotIn("tk_", blob)
        self.assertIn("ActionExtension", data["WFWorkflowTypes"])
        self.assertEqual(data["WFWorkflowImportQuestions"][0]["ActionIndex"], 0)
        identifiers = [item["WFWorkflowActionIdentifier"] for item in data["WFWorkflowActions"]]
        self.assertIn("is.workflow.actions.downloadurl", identifiers)
        self.assertIn("is.workflow.actions.alert", identifiers)


if __name__ == "__main__":
    unittest.main()
