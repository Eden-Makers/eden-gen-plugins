---
title: Eden Gen
emoji: "🎞️"
colorFrom: yellow
colorTo: red
sdk: gradio
sdk_version: 5.49.1
app_file: app.py
pinned: false
license: mit
---

# Eden Gen on Hugging Face

Gradio demo. The visitor pastes a personal token (`tkp_`). Show price calls `POST /v1/estimate`. Generate creates one take only after that, polls, and displays the image or video URL. The token is not written to a Space secret and is not printed. Each visitor spends their own Eden Gen credit.

The Python client is `eden.py`. `app.py` only builds the UI. Tests do not import Gradio and do not call the network.

## Check

```bash
python3 -m unittest test_eden.py
python3 -m py_compile eden.py app.py
```

Install Gradio when you want the UI: `pip install -r requirements.txt` and `python app.py`.

## Space submission

1. Create a Hugging Face account for Edenmakers. A free CPU Space is enough for this demo. Confirm the current hardware price before you upgrade it. This scaffold does not select paid hardware.
2. Create a Space, SDK Gradio, and push this folder. Do not add the token as a Space secret. The form is the token.
3. Open the Space, paste a token, show a price, generate one cheap image. Confirm the logs do not contain the token.
4. Screenshots of the price and the image. A short video of that path.
5. The Space README already points at https://edengen.ai/privacy and the token settings page. Support is support@edengen.ai.
6. Leave the Space private until you mean to show it. Do not create the Space from this pull request.

## Review requirements

Hugging Face may review Spaces that are public. The listing should say the token is the visitor's, that a price is shown first, and that generated media is billed to that Eden Gen workspace. This demo does not call any model hosted on Hugging Face.

## Costs

`usd_total` comes from the estimate. This folder does not hardcode a model price. A failed take is refunded when `refunded` is true. The Space's own hardware, if you leave the free CPU tier, is a Hugging Face bill and is separate.

## Human still does

A Hugging Face account, creating the Space from this folder, one generate, screenshots, and the demo video. Do not put a shared token in the Space. If the Space is public, anyone with a token can spend their own credit, which is the point of the form.
