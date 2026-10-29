/* global kwbLoadSettings, kwbCompile */
const $ = (id) => document.getElementById(id);
let settings;

function save(patch) {
  settings = { ...settings, ...patch };
  chrome.storage.sync.set(patch);
  render();
}

function addKeywords(raw) {
  const incoming = raw.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
  const existing = new Set(settings.keywords.map((k) => k.toLowerCase()));
  const added = incoming.filter((k) => {
    const key = k.toLowerCase();
    if (existing.has(key)) return false;
    existing.add(key);
    return true;
  });
  if (added.length) save({ keywords: [...settings.keywords, ...added] });
}

function render() {
  document.body.classList.toggle("off", !settings.enabled);
  $("enabled").checked = settings.enabled;
  $("site-reddit").checked = settings.sites.reddit;
  $("site-youtube").checked = settings.sites.youtube;
  $("site-x").checked = settings.sites.x;
  $("hideComments").checked = settings.hideComments;
  $("wholeWord").checked = settings.wholeWord;
  $("cardScope").checked = settings.matchScope === "card";

  const list = $("kw-list");
  list.textContent = "";
  for (const kw of settings.keywords) {
    const li = document.createElement("li");
    const label = document.createElement("span");
    label.textContent = kw;
    label.title = kw;
    if (kwbCompile([kw], true).length === 0) {
      li.classList.add("invalid");
      li.title = "Invalid regular expression – this one is ignored";
    }
    const del = document.createElement("button");
    del.type = "button";
    del.textContent = "×";
    del.title = `Remove "${kw}"`;
    del.addEventListener("click", () => save({ keywords: settings.keywords.filter((k) => k !== kw) }));
    li.append(label, del);
    list.append(li);
  }
  $("empty").hidden = settings.keywords.length > 0;
  if (!$("text-edit").open) $("kw-text").value = settings.keywords.join("\n");
}

async function showCount() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;
  chrome.tabs.sendMessage(tab.id, { type: "kwb-get-count" }, (res) => {
    if (chrome.runtime.lastError || !res) return; // not a Reddit/YouTube/X tab
    const name = { reddit: "Reddit", youtube: "YouTube", x: "X" }[res.site] || res.site;
    $("status").innerHTML = "";
    const strong = document.createElement("strong");
    strong.textContent = res.count;
    $("status").append(strong, ` item${res.count === 1 ? "" : "s"} hidden on this ${name} page`);
  });
}

// ── Events ───────────────────────────────────────────────────────────────────
$("add-form").addEventListener("submit", (e) => {
  e.preventDefault();
  addKeywords($("kw-input").value);
  $("kw-input").value = "";
  $("kw-input").focus();
});

$("save-text").addEventListener("click", () => {
  const list = [];
  const seen = new Set();
  for (const line of $("kw-text").value.split("\n")) {
    const k = line.trim();
    if (k && !seen.has(k.toLowerCase())) { seen.add(k.toLowerCase()); list.push(k); }
  }
  $("text-edit").open = false;
  save({ keywords: list });
});

$("enabled").addEventListener("change", (e) => save({ enabled: e.target.checked }));
$("hideComments").addEventListener("change", (e) => save({ hideComments: e.target.checked }));
$("wholeWord").addEventListener("change", (e) => save({ wholeWord: e.target.checked }));
$("cardScope").addEventListener("change", (e) => save({ matchScope: e.target.checked ? "card" : "title" }));
$("site-reddit").addEventListener("change", (e) => save({ sites: { ...settings.sites, reddit: e.target.checked } }));
$("site-youtube").addEventListener("change", (e) => save({ sites: { ...settings.sites, youtube: e.target.checked } }));
$("site-x").addEventListener("change", (e) => save({ sites: { ...settings.sites, x: e.target.checked } }));

// Refresh the count shortly after changes so it reflects the new list
chrome.storage.onChanged.addListener(() => setTimeout(showCount, 300));

kwbLoadSettings().then((s) => {
  settings = s;
  render();
  showCount();
  $("kw-input").focus();
});
