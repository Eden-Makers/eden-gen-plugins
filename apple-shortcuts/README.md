# Eden Gen for Apple Shortcuts

Two ways to run the same flow. The recipe is what a person builds if the unsigned file drops a field. `Eden-Gen-Imagine.shortcut` is an unsigned XML property list with the same steps. Shortcuts on a Mac or iPhone has to open it and sign it. This repository cannot sign shortcuts. There is no App Store product for a shortcut, and no Apple Developer fee is required to share one.

Auth is a personal token (`tkp_`) stored in the shortcut by an import question. The file in git has an empty token. Do not paste a real token into the file. Shortcuts is not a browser, so takes does not need a CORS origin. No OAuth redirect is used.

## Regenerate the file

```bash
python3 build_shortcut.py
python3 -m unittest test_shortcut.py
```

## Recipe

Build this in the Shortcuts app. Name it Eden Gen Imagine. Enable Show in Share Sheet, and accept Text.

1. Text. Leave it empty while you build it. On import, Shortcuts should ask for the personal token. If you are building by hand, run the shortcut once, paste the token, and use the magic variable from that Text action afterwards. Do not share a copy that still contains the token.
2. If Shortcut Input has any value, set Prompt to Shortcut Input. Otherwise Ask for Input, "Prompt for Eden Gen".
3. Get contents of URL.
   - URL `https://edengen.ai/v1/estimate`
   - Method POST
   - Headers: `Authorization` = `Bearer` plus the token variable, `Content-Type` = `application/json`, `Accept` = `application/json`
   - Request body JSON:
     - `model`: `nano-banana-2.1` (or `seedance-2.5` for a video shortcut)
     - `prompt`: the Prompt variable
     - `aspect_ratio`: `1:1` for a still, `16:9` for video
     - `count`: `1`
     - `duration`: `5` only on the video shortcut
4. Get dictionary from the result. Get `usd_total` and `can_run`.
5. If `can_run` is false, Show Alert with the dictionary and Stop.
6. Show Alert: "This take costs $" plus `usd_total`. Continue only if you accept it. A created take is not cancelled by leaving Shortcuts.
7. Get contents of URL `https://edengen.ai/v1/takes`, POST, same headers, plus `Idempotency-Key` set to a new UUID (the UUID action). JSON body is the same as the estimate, and add `confirm_cost` true when the estimate's `needs_confirmation` was true.
8. Repeat 30 times:
   - Get dictionary value `id` and `status`.
   - If status is `succeeded`, exit the repeat.
   - If status is `failed`, Show Alert with `error` and Stop.
   - Wait 2 seconds.
   - Get contents of URL `https://edengen.ai/v1/takes/` plus the id, GET, with the Authorization header.
9. Get dictionary value `output` then `url`. Get contents of that URL.
10. For a still, Save to Photo Album, or receive it in the share sheet. For a video, Save File or share the movie.

Share sheet: from Photos or a note, share text into Eden Gen Imagine. The prompt is that text. The token is already in the shortcut.

The unsigned file includes the URL actions, the alert, a 30-step wait loop, the share-sheet type, and the import question. It does not wire every magic variable, because those references break without the Shortcuts editor. After you open it, connect the token and the prompt to the URL actions using the list above, then run one cheap image before you share the shortcut.

## Costs

The alert is the estimate's `usd_total`. This folder does not hardcode a model price. A failed take is refunded when `refunded` is true. iCloud or RoutineHub, if you publish there later, is optional and is not a fee from Apple for a private shortcut.

## Human still does

A Mac or iPhone with Shortcuts, opening the file, connecting the variables, one share-sheet run, screenshots, and a short video if you want to publish it. Do not upload the shortcut with a token inside it. Sharing from the Shortcuts app signs the file. This pull request does not share it.
