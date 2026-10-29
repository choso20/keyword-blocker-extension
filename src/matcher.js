// Turns the keyword list into regular expressions.
//
// Keyword formats:
//   spoiler            plain word
//   the last of us     phrase (matched as a whole)
//   /gta ?(6|vi)/      regular expression between slashes (always case-insensitive)

function kwbEscape(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Letters/numbers in any language count as "word" characters, so whole-word
// matching works for non-English keywords and things like "c++" too.
const KWB_WORD_BEFORE = "(?<![\\p{L}\\p{N}_])";
const KWB_WORD_AFTER = "(?![\\p{L}\\p{N}_])";

function kwbCompile(keywords, wholeWord) {
  const out = [];
  for (const raw of keywords) {
    const kw = String(raw).trim();
    if (!kw) continue;
    const rx = kw.match(/^\/(.+)\/([a-z]*)$/);
    try {
      if (rx) {
        const flags = new Set((rx[2] + "iu").split(""));
        flags.delete("g"); // global flag makes .test() stateful
        out.push({ keyword: kw, re: new RegExp(rx[1], [...flags].join("")) });
      } else {
        // Collapse runs of spaces so "the  last of us" still matches
        const norm = kw.normalize("NFKC");
        const body = kwbEscape(norm).replace(/\s+/g, "\\s+");
        // Only enforce a boundary on ends that are word characters, so "c++" still
        // matches "c++20" while "cat" doesn't match "category"
        const isWord = (ch) => /[\p{L}\p{N}_]/u.test(ch);
        const src = wholeWord
          ? (isWord(norm[0]) ? KWB_WORD_BEFORE : "") + body + (isWord(norm[norm.length - 1]) ? KWB_WORD_AFTER : "")
          : body;
        out.push({ keyword: kw, re: new RegExp(src, "iu") });
      }
    } catch (e) {
      console.warn("[Keyword Blocker] Skipping invalid pattern:", kw, e.message);
    }
  }
  return out;
}

// Returns the keyword that matched, or null.
function kwbFirstMatch(compiled, text) {
  if (!text) return null;
  const t = text.normalize("NFKC");
  for (const c of compiled) if (c.re.test(t)) return c.keyword;
  return null;
}

if (typeof module !== "undefined") module.exports = { kwbCompile, kwbFirstMatch };
