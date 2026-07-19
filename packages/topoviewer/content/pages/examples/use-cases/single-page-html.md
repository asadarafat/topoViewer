# Single Page HTML

**Support status:** Supported Adapter

Use the single-page HTML path when you want a quick, no-build TopoViewer
application: a CodePen demo, a static runbook page, an internal wiki iframe, or
a throwaway NOC replay that should still use real topology objects instead of a
static screenshot.

This example builds a small NOC time machine. The page owns incident state,
generates TopoViewer topology and stylesheet documents in memory, and mounts the
published embed bundle for each incident step.

## Try It In CodePen

1. Open [CodePen](https://codepen.io/pen/).
2. Paste the complete HTML below into the HTML panel.
3. Press `Run`.
4. Click each incident step, then click `Run the chaos drill`.

The quick win is that there is no bundler, package install, or local dev server.
You still get a real TopoViewer viewport with layers, labels, regions, styling,
and attention.

??? example "Copy the complete single-page HTML"

    ```html
    <!doctype html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <title>TopoViewer NOC Time Machine</title>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/topoviewer@0.3.0/dist/embed/topoviewer-embed.css">
      <style>
        body { margin: 0; min-height: 100vh; background: radial-gradient(circle at top left, #18345f, #050914 48%, #02040a); color: #e5f2ff; font-family: Inter, system-ui, sans-serif; }
        .app { display: grid; grid-template-columns: 320px 1fr; gap: 18px; padding: 18px; height: 100vh; box-sizing: border-box; }
        .panel, .stage { border: 1px solid rgba(125,211,252,.24); background: rgba(5,10,24,.82); border-radius: 24px; overflow: hidden; box-shadow: 0 24px 80px rgba(0,0,0,.45); }
        .panel { padding: 18px; display: flex; flex-direction: column; gap: 14px; }
        h1 { font-size: 25px; line-height: 1.05; margin: 0; }
        .tag { color: #7dd3fc; font-size: 12px; text-transform: uppercase; letter-spacing: .14em; }
        .copy { color: #a7b9d6; font-size: 13px; line-height: 1.55; margin: 0; }
        .metric { display: grid; grid-template-columns: 1fr auto; padding: 12px; background: rgba(15,23,42,.72); border: 1px solid rgba(148,163,184,.18); border-radius: 16px; }
        .metric span { color: #9fb2d2; font-size: 12px; }
        .metric strong { font-size: 20px; }
        .buttons { display: grid; gap: 8px; }
        button { cursor: pointer; border: 1px solid rgba(125,211,252,.25); background: rgba(14,165,233,.12); color: #dff7ff; border-radius: 14px; padding: 10px 12px; text-align: left; font: inherit; }
        button:hover, button.active { background: linear-gradient(135deg, rgba(14,165,233,.34), rgba(168,85,247,.22)); border-color: rgba(125,211,252,.65); }
        .auto { text-align: center; font-weight: 800; background: linear-gradient(135deg, #0ea5e9, #8b5cf6); border: 0; }
        .stage { display: grid; grid-template-rows: auto 1fr; min-width: 0; }
        .topbar { display: flex; justify-content: space-between; gap: 12px; padding: 14px 18px; border-bottom: 1px solid rgba(148,163,184,.16); }
        .headline { font-weight: 900; }
        .pill { color: #99f6e4; background: rgba(20,184,166,.12); border: 1px solid rgba(45,212,191,.25); padding: 6px 10px; border-radius: 999px; font-size: 12px; text-decoration: none; }
        #viewerHost, .topoviewer-embed { height: 100%; min-height: 0; }
        @media (max-width: 900px) { .app { grid-template-columns: 1fr; height: auto; } .stage { height: 720px; } }
      </style>
    </head>
    <body>
      <div class="app">
        <aside class="panel">
          <div class="tag">TopoViewer powered war room</div>
          <h1>NOC Time Machine</h1>
          <p class="copy">A fake outage replay. This page generates TopoViewer topology files in memory and remounts the official embed bundle for each incident step.</p>
          <div class="metric"><span>Customer impact</span><strong id="impact">0%</strong></div>
          <div class="metric"><span>Reroute confidence</span><strong id="confidence">99%</strong></div>
          <div class="metric"><span>Active incident</span><strong id="incident">Calm</strong></div>
          <div class="buttons" id="buttons"></div>
          <button class="auto" id="auto">Run the chaos drill</button>
        </aside>

        <main class="stage">
          <div class="topbar">
            <div>
              <div class="tag">Live topology replay</div>
              <div class="headline" id="headline">All systems nominal</div>
            </div>
            <a class="pill" href="https://github.com/asadarafat/topoviewer" target="_blank" rel="noreferrer">topoviewer</a>
          </div>
          <div id="viewerHost"></div>
        </main>
      </div>

      <script src="https://cdn.jsdelivr.net/npm/topoviewer@0.3.0/dist/embed/topoviewer-embed.iife.js"></script>
      <script>
        var host = document.getElementById("viewerHost");
        var buttons = document.getElementById("buttons");
        var headline = document.getElementById("headline");
        var impact = document.getElementById("impact");
        var confidence = document.getElementById("confidence");
        var incident = document.getElementById("incident");

        var scenarios = [
          { name: "T-00 Calm", title: "All systems nominal", impact: "0%", confidence: "99%", incident: "Calm", focus: "grafana", badNodes: [], badLinks: [], healNodes: [] },
          { name: "T+07 Fiber cut", title: "Atlantic fiber cut, traffic drains east", impact: "18%", confidence: "86%", incident: "Fiber", focus: "lon-core", badNodes: ["lon-core"], badLinks: ["fiber-sfo-lon"], healNodes: ["mad-core"] },
          { name: "T+12 BGP leak", title: "Route leak detected, controller isolates peer", impact: "41%", confidence: "64%", incident: "BGP", focus: "ams-edge", badNodes: ["ams-edge", "nrc"], badLinks: ["bgp-ams-nrc", "svc-game"], healNodes: ["nsp"] },
          { name: "T+19 DDoS wave", title: "DDoS wave hits gaming edge, scrubbing path opens", impact: "57%", confidence: "72%", incident: "DDoS", focus: "game-pop", badNodes: ["game-pop"], badLinks: ["access-game"], healNodes: ["scrub"] },
          { name: "T+31 Self healing", title: "TopoViewer shows the runbook before coffee gets cold", impact: "4%", confidence: "97%", incident: "Recovered", focus: "nsp", badNodes: [], badLinks: [], healNodes: ["nsp", "nrc", "scrub"] }
        ];

        var stylesheet = {
          stylesheet: [
            { selector: "node", style: { shape: "rectangle", backgroundColor: "#0f172a", borderColor: "#7dd3fc", borderWidth: 2, labelColor: "#e0f2fe", width: 88, height: 58 } },
            { selector: "link", style: { lineColor: "#60a5fa", lineWidth: 2, lineOpacity: 0.72, targetArrowShape: "triangle", targetArrowColor: "#60a5fa" } },
            { selector: "region", style: { backgroundColor: "rgba(14,165,233,.07)", borderColor: "rgba(125,211,252,.28)", borderWidth: 1, labelColor: "#e0f2fe" } },
            { selector: "node[labels.kind = \"controller\"]", style: { backgroundColor: "#3b0764", borderColor: "#c084fc" } },
            { selector: "node[labels.kind = \"customer\"]", style: { backgroundColor: "#052e16", borderColor: "#86efac" } },
            { selector: "node[labels.kind = \"security\"]", style: { backgroundColor: "#042f2e", borderColor: "#5eead4" } },
            { selector: "node[labels.health = \"critical\"]", style: { backgroundColor: "#450a0a", borderColor: "#fb7185", borderWidth: 5 } },
            { selector: "node[labels.health = \"healing\"]", style: { backgroundColor: "#052e2b", borderColor: "#2dd4bf", borderWidth: 4 } },
            { selector: "link[labels.kind = \"control\"]", style: { lineColor: "#c084fc", lineWidth: 3, lineStyle: "dashed" } },
            { selector: "link[labels.kind = \"telemetry\"]", style: { lineColor: "#38bdf8", lineStyle: "dotted" } },
            { selector: "link[labels.kind = \"service\"]", style: { lineColor: "#22c55e", lineWidth: 4 } },
            { selector: "link[labels.kind = \"bypass\"]", style: { lineColor: "#f59e0b", lineWidth: 5 } },
            { selector: "link[labels.health = \"critical\"]", style: { lineColor: "#fb7185", lineWidth: 7, lineOpacity: 1 } }
          ]
        };

        var current = 0;
        var timer = null;
        var liveUrls = [];

        function has(list, id) {
          return list.indexOf(id) !== -1;
        }

        function node(id, displayName, kind, x, y, layers, health) {
          return { id: id, labels: { name: displayName, kind: kind, health: health }, layers: layers, position: [x, y] };
        }

        function link(id, source, target, kind, layers, health) {
          return { id: id, source: source, target: target, labels: { kind: kind, health: health }, layers: layers };
        }

        function buildTopology(s) {
          function health(id) {
            if (has(s.badNodes, id)) return "critical";
            if (has(s.healNodes, id)) return "healing";
            return "ok";
          }
          function linkHealth(id) {
            return has(s.badLinks, id) ? "critical" : "ok";
          }

          return {
            version: "0.2",
            graph: {
              id: "noc-time-machine",
              layers: [
                { id: "underlay", labels: { name: "Underlay" } },
                { id: "control", labels: { name: "Control plane" } },
                { id: "services", labels: { name: "Services" } },
                { id: "telemetry", labels: { name: "Telemetry" } },
                { id: "incident", labels: { name: "Incident" } }
              ],
              nodes: [
                node("sfo-edge", "SFO Edge", "router", 90, 250, ["underlay", "services"], health("sfo-edge")),
                node("lon-core", "London Core", "router", 360, 160, ["underlay", "control"], health("lon-core")),
                node("mad-core", "Madrid Bypass", "router", 360, 350, ["underlay", "incident"], health("mad-core")),
                node("ams-edge", "AMS Edge", "router", 650, 230, ["underlay", "services", "control"], health("ams-edge")),
                node("nsp", "NSP Intent Brain", "controller", 480, 40, ["control", "telemetry"], health("nsp")),
                node("nrc", "NRC Path Engine", "controller", 720, 70, ["control"], health("nrc")),
                node("grafana", "Grafana NOC Wall", "controller", 180, 55, ["telemetry"], health("grafana")),
                node("scrub", "Scrubbing Cloud", "security", 780, 385, ["incident", "services"], health("scrub")),
                node("game-pop", "Game POP", "customer", 930, 235, ["services"], health("game-pop")),
                node("bank-pop", "Bank POP", "customer", 930, 115, ["services"], health("bank-pop"))
              ],
              links: [
                link("fiber-sfo-lon", "sfo-edge", "lon-core", "fiber", ["underlay"], linkHealth("fiber-sfo-lon")),
                link("fiber-lon-ams", "lon-core", "ams-edge", "fiber", ["underlay"], linkHealth("fiber-lon-ams")),
                link("fiber-sfo-mad", "sfo-edge", "mad-core", "bypass", ["incident"], linkHealth("fiber-sfo-mad")),
                link("fiber-mad-ams", "mad-core", "ams-edge", "bypass", ["incident"], linkHealth("fiber-mad-ams")),
                link("bgp-lon-nsp", "lon-core", "nsp", "control", ["control"], linkHealth("bgp-lon-nsp")),
                link("bgp-ams-nrc", "ams-edge", "nrc", "control", ["control"], linkHealth("bgp-ams-nrc")),
                link("telemetry-sfo", "sfo-edge", "grafana", "telemetry", ["telemetry"], linkHealth("telemetry-sfo")),
                link("telemetry-ams", "ams-edge", "grafana", "telemetry", ["telemetry"], linkHealth("telemetry-ams")),
                link("svc-game", "ams-edge", "game-pop", "service", ["services"], linkHealth("svc-game")),
                link("svc-bank", "ams-edge", "bank-pop", "service", ["services"], linkHealth("svc-bank")),
                link("access-game", "game-pop", "scrub", "bypass", ["incident", "services"], linkHealth("access-game")),
                link("nsp-reroute", "nsp", "mad-core", "control", ["incident", "control"], linkHealth("nsp-reroute"))
              ],
              regions: [
                { id: "west", labels: { name: "US West" }, members: ["sfo-edge", "grafana"] },
                { id: "europe", labels: { name: "Europe Backbone" }, members: ["lon-core", "mad-core", "ams-edge"] },
                { id: "control", labels: { name: "Autonomous Control" }, members: ["nsp", "nrc"] },
                { id: "customers", labels: { name: "Customer Edge" }, members: ["game-pop", "bank-pop", "scrub"] }
              ]
            }
          };
        }

        function objectUrl(obj) {
          var url = URL.createObjectURL(new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" }));
          liveUrls.push(url);
          return url;
        }

        function renderScenario(index) {
          current = index;
          var s = scenarios[index];
          var oldUrls = liveUrls;
          liveUrls = [];

          headline.textContent = s.title;
          impact.textContent = s.impact;
          confidence.textContent = s.confidence;
          incident.textContent = s.incident;

          Array.prototype.forEach.call(buttons.children, function(b, i) {
            b.classList.toggle("active", i === index);
          });

          var el = document.createElement("div");
          el.className = "topoviewer-embed";
          el.dataset.topology = objectUrl(buildTopology(s));
          el.dataset.stylesheet = objectUrl(stylesheet);
          el.dataset.controls = "true";
          el.dataset.controlsOpen = "false";
          el.dataset.selectedLayerIds = JSON.stringify(["underlay", "control", "services", "telemetry", "incident"]);
          el.dataset.attention = JSON.stringify({ interactive: true, query: { ids: [s.focus], mode: "dim-context" } });

          host.replaceChildren(el);
          window.TopoViewerEmbed.mountAll();

          setTimeout(function() {
            oldUrls.forEach(function(url) { URL.revokeObjectURL(url); });
          }, 4000);
        }

        scenarios.forEach(function(s, i) {
          var b = document.createElement("button");
          b.textContent = s.name;
          b.onclick = function() { renderScenario(i); };
          buttons.appendChild(b);
        });

        document.getElementById("auto").onclick = function() {
          clearInterval(timer);
          renderScenario(0);
          timer = setInterval(function() {
            renderScenario((current + 1) % scenarios.length);
            if (current === scenarios.length - 1) clearInterval(timer);
          }, 2200);
        };

        renderScenario(0);
      </script>
    </body>
    </html>
    ```

## The UX Pattern

This example is shaped like a small operational replay:

```text
choose incident step
  -> derive node and link health
  -> generate topology and stylesheet blobs
  -> mount the TopoViewer embed
  -> inspect the focused topology object
```

The host page owns buttons, counters, headlines, and scenario data. TopoViewer
owns topology rendering, styling, layer filtering, and attention dimming.

## The DevX Pattern

The page loads only two TopoViewer assets:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/topoviewer@0.3.0/dist/embed/topoviewer-embed.css">
<script src="https://cdn.jsdelivr.net/npm/topoviewer@0.3.0/dist/embed/topoviewer-embed.iife.js"></script>
```

The application creates temporary URLs for JSON documents:

```js
el.dataset.topology = objectUrl(buildTopology(scenario));
el.dataset.stylesheet = objectUrl(stylesheet);
el.dataset.attention = JSON.stringify({ query: { ids: [scenario.focus], mode: "dim-context" } });
window.TopoViewerEmbed.mountAll();
```

That keeps the topology contract visible even in a no-build page:

```text
scenario data
  -> topology document
  -> stylesheet document
  -> embed data attributes
  -> TopoViewer viewport
```

## Use This Pattern When

Use single-page HTML when you need the fastest possible public or internal demo:

- CodePen or JSFiddle experiments;
- incident replay proof-of-concepts;
- static runbook pages;
- internal wiki embeds;
- vendor-neutral demos where a bundler would distract from the topology;
- quick validation that a topology document and stylesheet behave correctly.

Use the [React](react.md) use case when the viewer belongs inside a real React
application with component state, routing, tests, and packaged dependencies.
Use [MkDocs](mkdocs.md) when the diagram belongs in documentation.

## Production Notes

Single-page HTML is best for demos and static surfaces. For long-lived
applications, prefer the React package so dependencies are pinned through a
lockfile and topology generation can be tested with the rest of the product.

If a static page loads topology from users or remote systems, validate those
documents before exposing them publicly and treat SVG, labels, links, and image
references as untrusted input.
