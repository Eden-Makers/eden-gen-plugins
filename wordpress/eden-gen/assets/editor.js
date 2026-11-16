(function () {
  var el = wp.element.createElement;
  var useState = wp.element.useState;
  var useEffect = wp.element.useEffect;
  var PluginDocumentSettingPanel = wp.editPost.PluginDocumentSettingPanel;
  var Button = wp.components.Button;
  var TextareaControl = wp.components.TextareaControl;
  var SelectControl = wp.components.SelectControl;
  var Notice = wp.components.Notice;

  function panel() {
    var promptState = useState("");
    var prompt = promptState[0];
    var setPrompt = promptState[1];
    var modelState = useState("nano-banana-2.1");
    var model = modelState[0];
    var setModel = modelState[1];
    var modelsState = useState([]);
    var models = modelsState[0];
    var setModels = modelsState[1];
    var aspectState = useState("16:9");
    var aspect = aspectState[0];
    var setAspect = aspectState[1];
    var noteState = useState("");
    var note = noteState[0];
    var setNote = noteState[1];
    var errorState = useState("");
    var error = errorState[0];
    var setError = errorState[1];
    var estimateState = useState(null);
    var estimate = estimateState[0];
    var setEstimate = estimateState[1];
    var busyState = useState(false);
    var busy = busyState[0];
    var setBusy = busyState[1];

    useEffect(function () {
      wp.apiFetch({ path: "/edengen/v1/models" })
        .then(function (list) {
          if (list && list.length) {
            setModels(list);
            setModel(list[0].id);
          }
        })
        .catch(function (reason) {
          setError(reason && reason.message ? reason.message : "Could not load models.");
        });
    }, []);

    function body() {
      return { prompt: prompt, model: model, aspect_ratio: aspect };
    }

    function showPrice() {
      setError("");
      setBusy(true);
      wp.apiFetch({ path: "/edengen/v1/estimate", method: "POST", data: body() })
        .then(function (next) {
          setEstimate(next && next.can_run ? next : null);
          var price = next && typeof next.usd_total === "number" ? "$" + next.usd_total.toFixed(2) : "";
          var blockers = next && next.blockers && next.blockers.length ? " " + next.blockers.join(" ") : "";
          setNote(next && next.can_run ? "This take costs " + price + ". Confirm to spend workspace credit." : "This take cannot run (" + price + ")." + blockers);
        })
        .catch(function (reason) {
          setError(reason && reason.message ? reason.message : "Estimate failed.");
        })
        .finally(function () {
          setBusy(false);
        });
    }

    function poll(id, target) {
      var tries = 0;
      function step() {
        tries += 1;
        return wp.apiFetch({ path: "/edengen/v1/takes/" + id }).then(function (take) {
          setNote("Take " + take.id + " is " + take.status + ".");
          if (take.status === "succeeded") return place(take, target);
          if (take.status === "failed") throw new Error(take.error || "The take failed.");
          if (tries > 150) throw new Error("Take " + id + " is still " + take.status + ". Check it in Eden Gen before creating another.");
          return new Promise(function (resolve) {
            setTimeout(resolve, 2000);
          }).then(step);
        });
      }
      return step();
    }

    function place(take, target) {
      var postId = wp.data.select("core/editor").getCurrentPostId();
      return wp.apiFetch({
        path: "/edengen/v1/sideload",
        method: "POST",
        data: { id: take.id, post_id: postId, target: target },
      }).then(function (saved) {
        if (target === "inline" && saved.url) {
          var block = wp.blocks.createBlock("core/image", {
            url: saved.url,
            id: saved.attachment_id,
            alt: prompt,
          });
          wp.data.dispatch("core/block-editor").insertBlocks(block);
        }
        setEstimate(null);
        setNote("Saved take " + take.id + (take.simulated ? " (test result)." : "."));
      });
    }

    function generate(target) {
      if (!estimate) return;
      setBusy(true);
      setError("");
      var key = (window.crypto && crypto.randomUUID && crypto.randomUUID()) || String(Date.now());
      wp.apiFetch({
        path: "/edengen/v1/takes",
        method: "POST",
        data: Object.assign({}, body(), { idempotency_key: key }),
      })
        .then(function (created) {
          return poll(created.id, target);
        })
        .catch(function (reason) {
          setError(reason && reason.message ? reason.message : "Generate failed.");
        })
        .finally(function () {
          setBusy(false);
        });
    }

    var options = (models.length ? models : [{ id: model, name: model }]).map(function (item) {
      return { label: item.name, value: item.id };
    });

    return el(
      PluginDocumentSettingPanel,
      { name: "edengen", title: "Eden Gen", className: "edengen-panel" },
      el(SelectControl, {
        label: "Model",
        value: model,
        options: options,
        onChange: function (value) {
          setModel(value);
          setEstimate(null);
        },
      }),
      el(SelectControl, {
        label: "Aspect",
        value: aspect,
        options: [
          { label: "1:1", value: "1:1" },
          { label: "16:9", value: "16:9" },
          { label: "9:16", value: "9:16" },
          { label: "4:3", value: "4:3" },
        ],
        onChange: function (value) {
          setAspect(value);
          setEstimate(null);
        },
      }),
      el(TextareaControl, {
        label: "Prompt",
        value: prompt,
        onChange: function (value) {
          setPrompt(value);
          setEstimate(null);
        },
      }),
      note ? el("p", { className: "edengen-note" }, note) : null,
      error ? el(Notice, { status: "error", isDismissible: false }, error) : null,
      el(Button, { variant: "secondary", disabled: busy, onClick: showPrice }, busy ? "Working..." : "Show price"),
      el(
        Button,
        { variant: "primary", disabled: busy || !estimate, onClick: function () { generate("featured"); } },
        "Set featured image"
      ),
      el(
        Button,
        { variant: "secondary", disabled: busy || !estimate, onClick: function () { generate("inline"); } },
        "Insert image"
      )
    );
  }

  wp.plugins.registerPlugin("edengen", { render: panel });
})();
