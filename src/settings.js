// Shared defaults, used by both the content script and the popup.
// eslint-disable-next-line no-unused-vars
const KWB_DEFAULTS = {
  enabled: true,
  keywords: [],
  wholeWord: true,      // "cat" won't match "category"
  matchScope: "title",  // "title" = titles only, "card" = all text on the post/video card
  hideComments: false,
  sites: { reddit: true, youtube: true }
};

// eslint-disable-next-line no-unused-vars
function kwbLoadSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(KWB_DEFAULTS, (s) => {
      resolve({ ...KWB_DEFAULTS, ...s, sites: { ...KWB_DEFAULTS.sites, ...(s.sites || {}) } });
    });
  });
}
