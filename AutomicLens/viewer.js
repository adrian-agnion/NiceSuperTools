"use strict";

const SVG_NS = "http://www.w3.org/2000/svg";
const CHAR_W = 7.3;
const NODE_MIN_W = 76;
const NODE_H = 30;
const NODE_H_ALIAS = 44;
const GAP_X = 56;
const GAP_Y = 26;
const PAD = 24;
const ALIAS_MAX = 42;
const LANG_KEY = "automiclens-lang";

/* ------------------------------------------------------------------ i18n */

const I18N = {
  de: {
    subtitle: "Automic-Export (JOBP) laden — Tasks, Vorgänger/Nachfolger, Layout gemäß Row/Col und XML-Quelltext.",
    dropHint: "XML-Datei auswählen oder hier ablegen",
    prefix: "Volle Objektnamen (Präfixe zeigen)",
    noFile: "Keine Datei geladen.",
    graph: "Graph",
    names: "Namen",
    pairs: "Vorgänger / Nachfolger",
    code: "Code",
    fit: "Einpassen",
    thType: "Typ",
    thObject: "Objekt",
    thTitle: "Title (Alias)",
    hint: 'Knoten sind gemäß <code>Row</code>/<code>Col</code> der <code>task</code>-Elemente positioniert, Kanten folgen ' +
          '<code>PreLnr</code> aus <code>predecessors</code>. Mausrad zoomt, Ziehen auf freier Fläche verschiebt den Ausschnitt. ' +
          'Gleiche Präfixe der Objektnamen werden ausgeblendet, solange „Volle Objektnamen“ nicht aktiv ist.',
    pairsCount: n => n + " Paare",
    tasksCount: n => n + " Tasks",
    graphCount: (n, e) => `${n} Knoten · ${e} Kanten`,
    codeCount: (l, kb) => `${l} Zeilen · ${kb} KB`,
    loaded: (wf, n) => `${wf || "(ohne Namen)"} · ${n} Tasks`,
    hiddenPrefixes: p => "Ausgeblendete Präfixe: " + p,
    errParse: "XML-Parsefehler: ",
    errNoTasks: "Keine <task>-Elemente im XML gefunden."
  },
  en: {
    subtitle: "Load an Automic export (JOBP) — tasks, predecessors/successors, layout by Row/Col and XML source.",
    dropHint: "Select an XML file or drop it here",
    prefix: "Full object names (show prefixes)",
    noFile: "No file loaded.",
    graph: "Graph",
    names: "Names",
    pairs: "Predecessors / Successors",
    code: "Code",
    fit: "Fit",
    thType: "Type",
    thObject: "Object",
    thTitle: "Title (Alias)",
    hint: 'Nodes are positioned by <code>Row</code>/<code>Col</code> of the <code>task</code> elements, edges follow ' +
          '<code>PreLnr</code> from <code>predecessors</code>. Mouse wheel zooms, dragging on empty space pans the view. ' +
          'Identical prefixes of object names are hidden unless “Full object names” is active.',
    pairsCount: n => n + " pairs",
    tasksCount: n => n + " tasks",
    graphCount: (n, e) => `${n} nodes · ${e} edges`,
    codeCount: (l, kb) => `${l} lines · ${kb} KB`,
    loaded: (wf, n) => `${wf || "(unnamed)"} · ${n} tasks`,
    hiddenPrefixes: p => "Hidden prefixes: " + p,
    errParse: "XML parse error: ",
    errNoTasks: "No <task> elements found in XML."
  }
};

let lang = localStorage.getItem(LANG_KEY) || "de";
const t = key => {
  const v = I18N[lang][key];
  return typeof v === "function" ? v : (v ?? key);
};

const statusLine = document.getElementById("status");
const prefixToggle = document.getElementById("opt-prefix");
const stage = document.getElementById("stage");

const state = {
  workflow: "",
  tasks: [],
  xmlText: "",
  error: "",
  view: { scale: 1, tx: 0, ty: 0 },
  content: { w: 0, h: 0 },
  svg: null,
  viewport: null
};

function applyLanguage() {
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const v = I18N[lang][el.dataset.i18n];
    if (typeof v === "string") el.textContent = v;
  });
  document.querySelectorAll("[data-i18n-html]").forEach(el => {
    const v = I18N[lang][el.dataset.i18nHtml];
    if (typeof v === "string") el.innerHTML = v;
  });
  document.getElementById("lang-de").classList.toggle("active", lang === "de");
  document.getElementById("lang-en").classList.toggle("active", lang === "en");
  updateStatus();
  if (state.tasks.length) updateCounts();
}

function updateCounts() {
  const byLnr = new Map(state.tasks.map(x => [x.lnr, x]));
  const edgeCount = state.tasks.reduce((n, x) => n + x.preds.filter(p => byLnr.has(p.lnr)).length, 0);
  document.getElementById("pairs-count").textContent = t("pairsCount")(edgeCount);
  document.getElementById("names-count").textContent = t("tasksCount")(state.tasks.length);
  document.getElementById("graph-count").textContent = t("graphCount")(state.tasks.length, edgeCount);
  document.getElementById("code-count").textContent =
    t("codeCount")(state.xmlText.split(/\r?\n/).length, (state.xmlText.length / 1024).toFixed(1));
}

function updateStatus() {
  statusLine.innerHTML = "";
  if (state.error) {
    const span = document.createElement("span");
    span.className = "err";
    span.textContent = state.error;
    statusLine.appendChild(span);
    return;
  }
  if (!state.tasks.length) {
    statusLine.textContent = t("noFile");
    return;
  }
  const hidden = [...new Set(state.tasks.map(x => x.prefix).filter(Boolean))];
  statusLine.textContent = t("loaded")(state.workflow, state.tasks.length) +
    (hidden.length ? "\n" + t("hiddenPrefixes")(hidden.join(", ")) : "");
}

/* ---------------------------------------------------------------- Parsen */

function parseAutomicXml(text) {
  const doc = new DOMParser().parseFromString(text, "text/xml");
  const err = doc.getElementsByTagName("parsererror");
  if (err.length) throw new Error(t("errParse") + err[0].textContent.slice(0, 200));

  const root = doc.documentElement;
  const workflow = root.getAttribute("name")
    || (root.firstElementChild && root.firstElementChild.getAttribute("name"))
    || "";

  const tasks = [...doc.getElementsByTagName("task")].map(el => ({
    lnr: +el.getAttribute("Lnr") || 0,
    object: el.getAttribute("Object") || "",
    alias: el.getAttribute("Alias") || "",
    otype: el.getAttribute("OType") || "",
    row: +el.getAttribute("Row") || 1,
    col: +el.getAttribute("Col") || 1,
    preds: [...el.getElementsByTagName("pre")].map(p => ({
      lnr: +p.getAttribute("PreLnr") || 0,
      when: p.getAttribute("When") || ""
    }))
  }));
  tasks.sort((a, b) => a.lnr - b.lnr);
  if (!tasks.length) throw new Error(t("errNoTasks"));
  return { workflow, tasks };
}

const isFrame = task => task.otype === "<START>" || task.otype === "<END>";

/* -------------------------------------------------------------- Präfixe */

function commonPrefix(list) {
  let p = list[0];
  for (const s of list) {
    let i = 0;
    while (i < p.length && p[i] === s[i]) i++;
    p = p.slice(0, i);
    if (!p) break;
  }
  return p;
}

/**
 * Ermittelt je Objektname das ausblendbare Präfix: längstes gemeinsames,
 * an Punktgrenzen gekürztes Präfix aller Namen mit gleichem ersten Segment.
 * Rahmenknoten (START/END) bleiben unberücksichtigt.
 */
function computePrefixes(tasks) {
  const groups = new Map();
  for (const task of tasks) {
    task.prefix = "";
    if (isFrame(task)) continue;
    const i = task.object.indexOf(".");
    const key = i < 0 ? "" : task.object.slice(0, i);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(task);
  }
  for (const [key, list] of groups) {
    if (!key || list.length < 2) continue;
    const p = commonPrefix(list.map(x => x.object));
    const cut = p.lastIndexOf(".");
    if (cut <= 0) continue;
    const prefix = p.slice(0, cut + 1);
    for (const task of list) task.prefix = prefix;
  }
}

function displayName(task) {
  return prefixToggle.checked || !task.prefix ? task.object : task.object.slice(task.prefix.length);
}

/* ---------------------------------------------------------------- Bereiche */

function renderPairs(tasks) {
  const byLnr = new Map(tasks.map(x => [x.lnr, x]));
  const pairs = [];
  for (const task of tasks) {
    for (const p of task.preds) {
      const from = byLnr.get(p.lnr);
      if (from) pairs.push({ from, to: task });
    }
  }
  const labels = new Map();
  for (const { from, to } of pairs) {
    labels.set(from, displayName(from));
    labels.set(to, displayName(to));
  }
  const width = Math.max(4, ...[...labels.values()].map(n => n.length));
  document.getElementById("pairs-pre").textContent = pairs.length
    ? pairs.map(({ from, to }) => labels.get(from).padEnd(width) + " " + labels.get(to)).join("\n")
    : "—";
}

function renderNames(tasks) {
  const body = document.getElementById("names-body");
  body.textContent = "";
  for (const task of tasks) {
    const tr = document.createElement("tr");
    const cells = [task.lnr, task.otype, displayName(task), task.alias, task.row, task.col];
    cells.forEach((v, i) => {
      const td = document.createElement("td");
      td.textContent = v;
      if (i === 2) td.className = "name";
      if (i === 3) td.className = "alias";
      tr.appendChild(td);
    });
    body.appendChild(tr);
  }
}

/* ---------------------------------------------------------------- Graph */

function el(name, attrs, parent) {
  const node = document.createElementNS(SVG_NS, name);
  for (const key in attrs) node.setAttribute(key, attrs[key]);
  if (parent) parent.appendChild(node);
  return node;
}

function nodeLabel(task) {
  const name = displayName(task);
  return name.length > 30 ? name.slice(0, 29) + "…" : name;
}

function nodeAlias(task) {
  if (!task.alias) return "";
  return task.alias.length > ALIAS_MAX ? task.alias.slice(0, ALIAS_MAX - 1) + "…" : task.alias;
}

function nodeSize(task) {
  const w = Math.max(NODE_MIN_W,
    Math.round(Math.max(nodeLabel(task).length, nodeAlias(task).length) * CHAR_W) + 24);
  return { w, h: task.alias && !isFrame(task) ? NODE_H_ALIAS : NODE_H };
}

function geometry(tasks) {
  const cols = [...new Set(tasks.map(x => x.col))].sort((a, b) => a - b);
  const rows = [...new Set(tasks.map(x => x.row))].sort((a, b) => a - b);
  const colIndex = new Map(cols.map((c, i) => [c, i]));
  const rowIndex = new Map(rows.map((r, i) => [r, i]));

  const colW = cols.map(() => NODE_MIN_W);
  const rowH = rows.map(() => NODE_H);
  const sizes = new Map();
  for (const task of tasks) {
    const s = nodeSize(task);
    sizes.set(task, s);
    colW[colIndex.get(task.col)] = Math.max(colW[colIndex.get(task.col)], s.w);
    rowH[rowIndex.get(task.row)] = Math.max(rowH[rowIndex.get(task.row)], s.h);
  }

  const colX = [];
  let x = PAD;
  for (const w of colW) { colX.push(x); x += w + GAP_X; }
  const rowY = [];
  let y = PAD;
  for (const h of rowH) { rowY.push(y); y += h + GAP_Y; }

  const boxes = new Map();
  for (const task of tasks) {
    const s = sizes.get(task);
    const ci = colIndex.get(task.col), ri = rowIndex.get(task.row);
    boxes.set(task, {
      x: colX[ci] + (colW[ci] - s.w) / 2,
      y: rowY[ri] + (rowH[ri] - s.h) / 2,
      w: s.w, h: s.h
    });
  }
  return { boxes, w: x - GAP_X + PAD, h: y - GAP_Y + PAD };
}

function edgePath(a, b) {
  const x1 = a.x + a.w, y1 = a.y + a.h / 2;
  const x2 = b.x, y2 = b.y + b.h / 2;
  if (Math.abs(y1 - y2) < 0.5 && x2 > x1) return `M ${x1} ${y1} L ${x2} ${y2}`;
  if (x2 <= x1) {
    const sx = a.x + a.w / 2, tx = b.x + b.w / 2;
    const drop = Math.max(a.y, b.y) + Math.max(a.h, b.h) + Math.max(28, Math.abs(sx - tx) / 6);
    return `M ${sx} ${a.y + a.h} C ${sx} ${drop}, ${tx} ${drop}, ${tx} ${b.y + b.h}`;
  }
  const dx = Math.max(24, (x2 - x1) / 2);
  return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
}

function renderGraph(tasks) {
  const geo = geometry(tasks);
  state.content = { w: geo.w, h: geo.h };

  const svg = el("svg", { xmlns: SVG_NS });
  const defs = el("defs", {}, svg);
  const marker = el("marker", {
    id: "arrow", viewBox: "0 0 10 10", refX: "9", refY: "5",
    markerWidth: "7", markerHeight: "7", orient: "auto-start-reverse"
  }, defs);
  el("path", { d: "M 0 1 L 10 5 L 0 9 z", fill: "#7c8798" }, marker);

  const viewport = el("g", {}, svg);
  const edgeLayer = el("g", {}, viewport);
  const nodeLayer = el("g", {}, viewport);

  const byLnr = new Map(tasks.map(x => [x.lnr, x]));
  for (const task of tasks) {
    for (const p of task.preds) {
      const from = byLnr.get(p.lnr);
      if (!from) continue;
      const path = el("path", {
        class: "edge",
        d: edgePath(geo.boxes.get(from), geo.boxes.get(task)),
        "marker-end": "url(#arrow)"
      }, edgeLayer);
      const title = el("title", {}, path);
      title.textContent = `${from.object} → ${task.object}` + (p.when ? ` (${p.when})` : "");
    }
  }

  for (const task of tasks) {
    const b = geo.boxes.get(task);
    const frame = isFrame(task);
    const g = el("g", {
      class: "node" + (frame ? " frame" : ""),
      transform: `translate(${b.x} ${b.y})`
    }, nodeLayer);
    el("rect", { x: 0, y: 0, width: b.w, height: b.h, rx: frame ? 5 : 8, ry: frame ? 5 : 8 }, g);
    const alias = nodeAlias(task);
    const nameEl = el("text", { x: b.w / 2, y: alias ? b.h / 2 - 8 : b.h / 2 + 4 }, g);
    nameEl.textContent = nodeLabel(task);
    if (alias) {
      const aliasEl = el("text", { class: "alias", x: b.w / 2, y: b.h / 2 + 9 }, g);
      aliasEl.textContent = alias;
    }
    const title = el("title", {}, g);
    title.textContent = `${task.object}\nLnr ${task.lnr} · ${task.otype} · Row ${task.row} / Col ${task.col}` +
      (task.alias ? `\n${task.alias}` : "");
  }

  stage.textContent = "";
  stage.appendChild(svg);
  state.svg = svg;
  state.viewport = viewport;
  attachPanZoom(svg);
  fitView();
}

/* ------------------------------------------------------------- Pan/Zoom */

function applyView() {
  const { scale, tx, ty } = state.view;
  if (state.viewport) state.viewport.setAttribute("transform", `translate(${tx} ${ty}) scale(${scale})`);
}

function fitView() {
  const r = stage.getBoundingClientRect();
  const s = Math.min(r.width / state.content.w, r.height / state.content.h, 2);
  state.view.scale = s;
  state.view.tx = (r.width - state.content.w * s) / 2;
  state.view.ty = (r.height - state.content.h * s) / 2;
  applyView();
}

function zoomAt(factor, cx, cy) {
  const r = stage.getBoundingClientRect();
  const px = cx === undefined ? r.width / 2 : cx - r.left;
  const py = cy === undefined ? r.height / 2 : cy - r.top;
  const v = state.view;
  const s = Math.min(4, Math.max(0.1, v.scale * factor));
  v.tx = px - (px - v.tx) * (s / v.scale);
  v.ty = py - (py - v.ty) * (s / v.scale);
  v.scale = s;
  applyView();
}

function attachPanZoom(svg) {
  svg.addEventListener("wheel", e => {
    e.preventDefault();
    zoomAt(e.deltaY < 0 ? 1.15 : 1 / 1.15, e.clientX, e.clientY);
  }, { passive: false });

  let drag = null;
  svg.addEventListener("pointerdown", e => {
    if (e.button !== 0 && e.button !== 1) return;
    drag = { x: e.clientX, y: e.clientY, tx: state.view.tx, ty: state.view.ty };
    svg.classList.add("panning");
    svg.setPointerCapture(e.pointerId);
  });
  svg.addEventListener("pointermove", e => {
    if (!drag) return;
    state.view.tx = drag.tx + e.clientX - drag.x;
    state.view.ty = drag.ty + e.clientY - drag.y;
    applyView();
  });
  const stop = () => {
    drag = null;
    svg.classList.remove("panning");
  };
  svg.addEventListener("pointerup", stop);
  svg.addEventListener("pointercancel", stop);
}

/* -------------------------------------------------------------- XML-Code */

function highlightXml(text) {
  const esc = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  let inTag = false;
  return esc.replace(
    /(&lt;!--[\s\S]*?--&gt;)|(&lt;\?[\s\S]*?\?&gt;)|(&lt;!\[CDATA\[[\s\S]*?\]\]&gt;)|(&lt;\/?)([\w:.-]+)|([\w:.-]+)(=)("[^"]*"|'[^']*')|(\/?&gt;)/g,
    (m, comment, pi, cdata, open, tname, aname, eq, aval, close) => {
      if (comment) return `<span class="c">${comment}</span>`;
      if (pi) return `<span class="pi">${pi}</span>`;
      if (cdata) return `<span class="c">${cdata}</span>`;
      if (open) { inTag = true; return `<span class="tag">${open}</span><span class="tname">${tname}</span>`; }
      if (aname) {
        return inTag
          ? `<span class="attr">${aname}</span>${eq}<span class="aval">${aval}</span>`
          : m;
      }
      if (close) { inTag = false; return `<span class="tag">${close}</span>`; }
      return m;
    });
}

function renderCode(text) {
  document.getElementById("code-pre").innerHTML = highlightXml(text);
}

/* ---------------------------------------------------------------- Laden */

function renderAll() {
  computePrefixes(state.tasks);
  renderPairs(state.tasks);
  renderNames(state.tasks);
  renderGraph(state.tasks);
  renderCode(state.xmlText);
  updateCounts();
}

function loadContent(text) {
  try {
    const { workflow, tasks } = parseAutomicXml(text);
    state.workflow = workflow;
    state.tasks = tasks;
    state.xmlText = text;
    state.error = "";
    renderAll();
    updateStatus();
    for (const id of ["btn-fit", "btn-zoom-in", "btn-zoom-out"])
      document.getElementById(id).disabled = false;
  } catch (e) {
    state.error = e.message;
    updateStatus();
  }
}

/* ---------------------------------------------------------------- Events */

// Dropzone aus ../js/dropzone.js (unverändert): Klick öffnet Dateidialog, Drop liest die Datei.
// Das Original schreibt den Inhalt in outputElement.textContent — das Sink-Objekt
// fängt die Zuweisung über seinen Setter ab und startet das Parsen.
const fileSink = {
  set textContent(content) { loadContent(String(content)); },
  get textContent() { return ""; }
};
createDropzone(document.getElementById("dropzone"), fileSink);

prefixToggle.addEventListener("change", () => {
  if (state.tasks.length) {
    renderPairs(state.tasks);
    renderNames(state.tasks);
    renderGraph(state.tasks);
  }
});
document.getElementById("btn-fit").addEventListener("click", fitView);
document.getElementById("btn-zoom-in").addEventListener("click", () => zoomAt(1.25));
document.getElementById("btn-zoom-out").addEventListener("click", () => zoomAt(1 / 1.25));

function setLang(next) {
  lang = next;
  localStorage.setItem(LANG_KEY, lang);
  applyLanguage();
}
document.getElementById("lang-de").addEventListener("click", () => setLang("de"));
document.getElementById("lang-en").addEventListener("click", () => setLang("en"));

applyLanguage();
