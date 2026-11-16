"""Gradio Space. The token is typed by the visitor and used only for that call."""

import gradio as gr

import eden


def preview(token: str, kind: str, prompt: str, aspect: str):
    if not token.strip():
        raise gr.Error("Paste your Eden Gen token. It starts with tkp_.")
    if not prompt.strip():
        raise gr.Error("Write a prompt first.")
    model = eden.DEFAULT_MODELS["video" if kind == "video" else "image"]
    duration = 5 if kind == "video" else None
    price = eden.estimate(token, model, prompt.strip(), aspect, duration)
    return price.describe(), gr.update(interactive=price.can_run)


def generate(token: str, kind: str, prompt: str, aspect: str):
    take = eden.generate(
        token,
        kind,
        prompt.strip(),
        aspect,
        confirm=lambda _price: True,
    )
    note = f"Take {take.id}."
    if take.simulated:
        note += " Marked as a test result."
    if take.refunded:
        note += " The charge was refunded."
    if kind == "video":
        return note, None, take.output_url
    return note, take.output_url, None


with gr.Blocks(title="Eden Gen") as demo:
    gr.Markdown(
        "Eden Gen by Edenmakers. Paste your own token from "
        "[Settings, API and agents](https://edengen.ai/app/settings?tab=api). "
        "This Space does not store it. Show price does not spend credit."
    )
    token = gr.Textbox(label="API token", type="password")
    kind = gr.Radio(["image", "video"], value="image", label="Kind")
    aspect = gr.Dropdown(["1:1", "16:9", "9:16", "4:3"], value="1:1", label="Aspect")
    prompt = gr.Textbox(label="Prompt", lines=3)
    note = gr.Textbox(label="Price", interactive=False)
    go = gr.Button("Generate", interactive=False)
    image = gr.Image(label="Image")
    video = gr.Video(label="Video")
    gr.Button("Show price").click(preview, [token, kind, prompt, aspect], [note, go])
    go.click(generate, [token, kind, prompt, aspect], [note, image, video])


if __name__ == "__main__":
    demo.launch()
