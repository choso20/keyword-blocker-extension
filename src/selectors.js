// ─────────────────────────────────────────────────────────────────────────────
// Site selectors. Reddit, YouTube and X change their markup every so often; when
// something stops being hidden, this is the only file that should need editing.
//
// Each rule:
//   kind       "post" (always on) or "comment" (only when "Also hide comments" is on)
//   container  CSS selector for one post / video / comment card
//   title      CSS selectors tried in order to find the title inside the card
//   titleAll   optional: use the text of every match of a title selector, not just the first
//   titleAttr  attribute on the container itself that holds the title (checked first)
//   hide       optional: given the container, return the element to actually hide
// If no title is found, the card's full text is used instead, so a broken title
// selector degrades to "match anything on the card" rather than "match nothing".
// ─────────────────────────────────────────────────────────────────────────────

// eslint-disable-next-line no-unused-vars
const KWB_SITES = {
  reddit: {
    hosts: ["www.reddit.com", "sh.reddit.com", "old.reddit.com"],
    rules: [
      // New Reddit feed, subreddit and profile pages
      {
        kind: "post",
        container: "shreddit-post",
        titleAttr: "post-title",
        title: ['[slot="title"]', 'a[id^="post-title"]'],
        // Extra text included when "Match whole card" is on
        extraAttrs: ["subreddit-prefixed-name", "author"],
        // In feeds each post is wrapped in <article>; hide that so no gap is left
        hide: (el) => el.closest("article") || el
      },
      // New Reddit search results
      {
        kind: "post",
        container: '[data-testid="search-post-unit"], search-telemetry-tracker[data-testid="search-post"]',
        title: ['[data-testid="post-title-text"]', 'a[data-testid="post-title"]', "h3", "h2"]
      },
      // Old Reddit
      {
        kind: "post",
        container: "#siteTable > .thing.link",
        title: ["a.title"]
      },
      // Comments
      {
        kind: "comment",
        container: "shreddit-comment",
        title: ['[slot="comment"]', '[id$="-post-rtjson-content"]']
      },
      {
        kind: "comment",
        container: ".commentarea .thing.comment",
        title: [":scope > .entry .md"]
      }
    ]
  },

  youtube: {
    hosts: ["www.youtube.com", "m.youtube.com"],
    rules: [
      {
        kind: "post",
        container: [
          "ytd-rich-item-renderer",            // home / subscriptions grid
          "ytd-video-renderer",                // search results, history
          "ytd-compact-video-renderer",        // watch-page sidebar (older layout)
          "ytd-grid-video-renderer",           // channel pages (older layout)
          "ytd-playlist-video-renderer",       // playlists
          "ytd-reel-item-renderer",            // Shorts (older layout)
          "yt-lockup-view-model",              // newer layout: sidebar, channel pages
          "ytm-shorts-lockup-view-model",      // Shorts shelf
          "ytm-shorts-lockup-view-model-v2",
          "ytm-video-with-context-renderer",   // m.youtube.com
          "ytm-compact-video-renderer",
          "ytm-reel-item-renderer"
        ].join(", "),
        title: [
          "#video-title",
          "a#video-title-link",
          ".yt-lockup-metadata-view-model__title",
          ".yt-lockup-metadata-view-model-wiz__title",
          '[class*="shortsLockupViewModelHostMetadataTitle"]',
          ".media-item-headline",
          "h3 a[title]",
          "h3"
        ]
      },
      {
        kind: "comment",
        container: "ytd-comment-thread-renderer, ytm-comment-thread-renderer",
        title: ["#content-text", ".comment-text"]
      }
    ]
  },

  x: {
    hosts: ["x.com", "mobile.x.com", "twitter.com", "mobile.twitter.com"],
    rules: [
      // Posts in timelines, search, profiles, lists and threads. Replies on X are
      // posts too, so they're always checked, not just with "Also hide comments".
      {
        kind: "post",
        container: 'article[data-testid="tweet"]',
        title: ['[data-testid="tweetText"]'],
        // Join every match so the text of a quoted post counts too
        titleAll: true,
        // Timelines are virtual lists of cells; hide the cell so no gap is left
        hide: (el) => el.closest('[data-testid="cellInnerDiv"]') || el
      },
      // "What's happening" sidebar and Explore trends (no title, so the whole trend's text is used)
      {
        kind: "post",
        container: '[data-testid="trend"]',
        title: [],
        hide: (el) => el.closest('[data-testid="cellInnerDiv"]') || el
      }
    ]
  }
};
