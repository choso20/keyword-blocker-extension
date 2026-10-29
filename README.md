# Keyword Blocker

Hides Reddit posts and YouTube videos whose titles contain keywords you choose.
Works in Opera GX, Chrome, Edge, Brave, and any other Chromium browser.

## Install in Opera GX

1. Unzip this folder somewhere permanent (e.g. `Documents\keyword-blocker`). The browser loads it from there, so don't delete it.
2. Go to `opera://extensions`.
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked** and select the `keyword-blocker` folder (the one containing `manifest.json`).
5. Click the puzzle-piece icon in the sidebar/toolbar and pin **Keyword Blocker**.
6. Refresh any Reddit or YouTube tabs that were already open.

To use it in private windows, open **Details** on the extension and turn on **Allow in private mode**.

## Using it

Click the icon to open the popup:

- **Add keywords.** Separate several with commas.
  - `spoiler`: a single word
  - `the last of us`: a phrase
  - `/gta ?(6|vi)/`: a regular expression (case-insensitive)
- **Edit as text.** Edit the whole list at once, one keyword per line. It's also handy for backing up the list.
- The red badge on the icon shows how many items are hidden on the current tab.

### Options

| Option | What it does |
|---|---|
| Reddit / YouTube | Turn blocking on or off per site |
| Also hide comments | Hide Reddit and YouTube comments that match too. Hiding a Reddit comment hides its replies as well |
| Whole words only | On: `cat` won't hide "category". Off: substring matching |
| Match whole card | Also match against the channel name, subreddit, author and preview text, not just the title |

## What it covers

- **Reddit (new layout):** home, popular, subreddit and profile feeds, search results, and comments (optional)
- **Reddit (old.reddit.com):** post listings and comments (optional)
- **YouTube:** home, subscriptions, search, the watch-page sidebar, channel pages, playlists, Shorts shelves, comments (optional), and m.youtube.com

## When something slips through

Reddit and YouTube change their page structure every so often. If items stop being hidden:

1. Right-click the item that should have been hidden → **Inspect**.
2. Find the element that wraps the whole post or video card.
3. Add its tag or selector to `src/selectors.js`. Each site has a list of `container` selectors (the card) and `title` selectors (where the title is inside it).
4. Click the reload icon on the extension in `opera://extensions`, then refresh the page.

If the title selector breaks but the container still matches, the extension falls back to matching all the text on the card, so it fails "loud" rather than silently.

Hidden elements get a `data-kwb-match` attribute that shows which keyword hid them, which helps when checking in DevTools.

## Files

```
manifest.json      Extension manifest (MV3)
background.js      Sets the toolbar badge count
src/settings.js    Default settings and loader
src/selectors.js   Per-site CSS selectors (the file to edit when a site changes)
src/matcher.js     Keyword → regex compilation and matching
src/content.js     Runs on Reddit/YouTube: watches the page and hides matches
src/content.css    The actual hiding rule
popup/             The toolbar popup UI
icons/             Extension icons
```

Settings are saved with `chrome.storage.sync`, so they carry over to other installs if browser sync is on.
