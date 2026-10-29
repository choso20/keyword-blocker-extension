/* global KWB_SITES, kwbLoadSettings, kwbCompile, kwbFirstMatch */
(() => {
  const HIDDEN = "data-kwb-hidden";  // set on hidden elements; content.css does display:none
  const MATCH = "data-kwb-match";    // which keyword hid it (handy when inspecting the page)

  const host = location.hostname;
  const siteKey = Object.keys(KWB_SITES).find((k) => KWB_SITES[k].hosts.includes(host));
  if (!siteKey) return;
  const site = KWB_SITES[siteKey];

  let settings = null;
  let compiled = [];
  let version = 0;                 // bumped whenever settings change, forces a re-check
  const seen = new WeakMap();      // element -> signature of the last check
  let lastCount = -1;

  // ── Text extraction ────────────────────────────────────────────────────────
  function titleOf(el, rule) {
    if (rule.titleAttr) {
      const v = el.getAttribute(rule.titleAttr);
      if (v) return v;
    }
    for (const sel of rule.title || []) {
      let node;
      try { node = el.querySelector(sel); } catch { continue; }
      if (!node) continue;
      const t = (node.textContent || "").trim() || node.getAttribute("title") || node.getAttribute("aria-label");
      if (t) return t;
    }
    return null;
  }

  function textFor(el, rule) {
    const title = titleOf(el, rule);
    if (settings.matchScope === "card" || !title) {
      const parts = [title || "", el.textContent || ""];
      for (const a of rule.extraAttrs || []) parts.push(el.getAttribute(a) || "");
      return parts.join(" \n ").replace(/\s+/g, " ").trim();
    }
    return title;
  }

  // ── Hide / show ────────────────────────────────────────────────────────────
  function setHidden(target, keyword) {
    if (keyword) {
      target.setAttribute(HIDDEN, "1");
      target.setAttribute(MATCH, keyword);
      // Reddit puts an <hr> between feed posts; hide it too so lines don't double up
      const next = target.nextElementSibling;
      if (target.tagName === "ARTICLE" && next && next.tagName === "HR") next.setAttribute(HIDDEN, "sep");
    } else if (target.hasAttribute(HIDDEN)) {
      target.removeAttribute(HIDDEN);
      target.removeAttribute(MATCH);
      const next = target.nextElementSibling;
      if (next && next.getAttribute(HIDDEN) === "sep") next.removeAttribute(HIDDEN);
    }
  }

  function unhideAll() {
    document.querySelectorAll(`[${HIDDEN}]`).forEach((el) => {
      el.removeAttribute(HIDDEN);
      el.removeAttribute(MATCH);
    });
  }

  // ── Scanning ───────────────────────────────────────────────────────────────
  function activeRules() {
    return site.rules.filter((r) => r.kind === "post" || (r.kind === "comment" && settings.hideComments));
  }

  function scan() {
    if (!settings) return;
    const on = settings.enabled && settings.sites[siteKey] && compiled.length > 0;
    if (!on) {
      unhideAll();
      reportCount();
      return;
    }

    for (const rule of activeRules()) {
      let nodes;
      try { nodes = document.querySelectorAll(rule.container); } catch { continue; }
      for (const el of nodes) {
        // For posts/videos, only check the outermost card (YouTube nests cards inside cards)
        if (rule.kind === "post" && el.parentElement && el.parentElement.closest(rule.container)) continue;

        const text = textFor(el, rule);
        const sig = version + "\u0000" + text;
        if (seen.get(el) === sig) continue; // unchanged since last check
        seen.set(el, sig);

        const target = rule.hide ? rule.hide(el) : el;
        setHidden(target, kwbFirstMatch(compiled, text));
      }
    }

    // Comments may have been hidden earlier and the option since turned off
    if (!settings.hideComments) {
      for (const rule of site.rules.filter((r) => r.kind === "comment")) {
        try {
          document.querySelectorAll(rule.container).forEach((el) => {
            const target = rule.hide ? rule.hide(el) : el;
            setHidden(target, null);
          });
        } catch { /* bad selector */ }
      }
    }
    reportCount();
  }

  function countHidden() {
    let n = 0;
    document.querySelectorAll(`[${HIDDEN}="1"]`).forEach((el) => {
      // Don't count things inside something already hidden (e.g. replies in a hidden comment)
      if (!el.parentElement || !el.parentElement.closest(`[${HIDDEN}="1"]`)) n++;
    });
    return n;
  }

  function reportCount() {
    const n = countHidden();
    if (n === lastCount) return;
    lastCount = n;
    try { chrome.runtime.sendMessage({ type: "kwb-count", count: n }); } catch { /* extension reloaded */ }
  }

  // Coalesce DOM changes into at most one scan per animation frame. Frames run
  // before paint, so new posts are usually hidden before you ever see them.
  let queued = false;
  function queueScan() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      scan();
    });
  }

  // ── Wiring ─────────────────────────────────────────────────────────────────
  function applySettings(s) {
    settings = s;
    compiled = kwbCompile(s.keywords, s.wholeWord);
    version++;
    queueScan();
  }

  kwbLoadSettings().then(applySettings);

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "sync") kwbLoadSettings().then(applySettings);
  });

  chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
    if (msg && msg.type === "kwb-get-count") reply({ count: countHidden(), site: siteKey });
  });

  new MutationObserver(queueScan).observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ["post-title", "title", "aria-label"]
  });

  // YouTube and Reddit are single-page apps; these fire on in-app navigation
  window.addEventListener("yt-navigate-finish", queueScan);
  window.addEventListener("popstate", queueScan);
  // Safety net for anything the observer misses (and for background tabs, where
  // requestAnimationFrame is paused)
  setInterval(() => { if (document.visibilityState === "visible") scan(); }, 2000);
  document.addEventListener("visibilitychange", queueScan);
})();
