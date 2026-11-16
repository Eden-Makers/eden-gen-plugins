#!/usr/bin/env python3
"""Write an unsigned Eden Gen shortcut. A Mac still has to open and sign it."""

from __future__ import annotations

import plistlib
from pathlib import Path

OUT = Path(__file__).with_name("Eden-Gen-Imagine.shortcut")


def action(identifier: str, parameters: dict) -> dict:
    return {
        "WFWorkflowActionIdentifier": identifier,
        "WFWorkflowActionParameters": parameters,
    }


def text_token(value: str) -> dict:
    return {
        "Value": {"string": value, "attachmentsByRange": {}},
        "WFSerializationType": "WFTextTokenString",
    }


def build() -> dict:
    token = action(
        "is.workflow.actions.gettext",
        {"WFTextActionText": text_token("")},
    )
    prompt = action(
        "is.workflow.actions.ask",
        {
            "WFAskActionPrompt": "Prompt for Eden Gen",
            "WFInputType": "Text",
            "WFAskActionDefaultAnswer": text_token(""),
        },
    )
    estimate = action(
        "is.workflow.actions.downloadurl",
        {
            "WFURL": "https://edengen.ai/v1/estimate",
            "WFHTTPMethod": "POST",
            "WFHTTPBodyType": "JSON",
            "ShowHeaders": True,
        },
    )
    show = action(
        "is.workflow.actions.alert",
        {
            "WFAlertActionTitle": "Eden Gen",
            "WFAlertActionMessage": "Read usd_total in the estimate. Continue only if you accept that price. A created take is not cancelled by leaving Shortcuts.",
        },
    )
    create = action(
        "is.workflow.actions.downloadurl",
        {
            "WFURL": "https://edengen.ai/v1/takes",
            "WFHTTPMethod": "POST",
            "WFHTTPBodyType": "JSON",
            "ShowHeaders": True,
        },
    )
    wait = action("is.workflow.actions.delay", {"WFDelayTime": 2})
    status = action(
        "is.workflow.actions.downloadurl",
        {
            "WFURL": "https://edengen.ai/v1/takes/",
            "WFHTTPMethod": "GET",
            "ShowHeaders": True,
        },
    )
    repeat = action(
        "is.workflow.actions.repeat.count",
        {"WFRepeatCount": 30, "WFControlFlowMode": 0},
    )
    repeat_end = action(
        "is.workflow.actions.repeat.count",
        {"WFControlFlowMode": 2, "GroupingIdentifier": "eden-poll"},
    )
    repeat["WFWorkflowActionParameters"]["GroupingIdentifier"] = "eden-poll"
    save = action(
        "is.workflow.actions.savetocameraroll",
        {"WFCameraRollSelectedGroup": "Recents"},
    )
    return {
        "WFWorkflowClientVersion": "2700.0.4",
        "WFWorkflowClientRelease": "2700",
        "WFWorkflowMinimumClientVersion": 900,
        "WFWorkflowMinimumClientVersionString": "900",
        "WFWorkflowName": "Eden Gen Imagine",
        "WFWorkflowIcon": {
            "WFWorkflowIconStartColor": 4282601983,
            "WFWorkflowIconGlyphNumber": 59511,
        },
        "WFWorkflowTypes": ["ActionExtension", "NCWidget"],
        "WFWorkflowInputContentItemClasses": [
            "WFStringContentItem",
            "WFAppStoreAppContentItem",
        ],
        "WFWorkflowHasShortcutInputVariables": True,
        "WFWorkflowImportQuestions": [
            {
                "ActionIndex": 0,
                "Category": "Parameter",
                "DefaultValue": "",
                "ParameterKey": "WFTextActionText",
                "Text": "Paste your Eden Gen personal token from Settings, API and agents. It stays in this shortcut on your device.",
            }
        ],
        "WFWorkflowActions": [token, prompt, estimate, show, create, repeat, status, wait, repeat_end, save],
    }


def main() -> None:
    payload = build()
    OUT.write_bytes(plistlib.dumps(payload, fmt=plistlib.FMT_XML))
    print(OUT)


if __name__ == "__main__":
    main()
