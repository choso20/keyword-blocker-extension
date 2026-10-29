// Shows how many items are hidden on each tab as a badge on the toolbar icon.
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (!msg || msg.type !== "kwb-count" || !sender.tab) return;
  const tabId = sender.tab.id;
  chrome.action.setBadgeText({ tabId, text: msg.count > 0 ? String(msg.count) : "" });
  chrome.action.setBadgeBackgroundColor({ tabId, color: "#fa1e4e" });
});
