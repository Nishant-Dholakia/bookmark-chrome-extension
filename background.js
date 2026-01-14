importScripts("autotags.js");

chrome.commands.onCommand.addListener((command) => {
  if (command !== "save-bookmark") return;

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs?.length) return;

    const tab = tabs[0];

    chrome.storage.local.get(["bookmarks"], (res) => {
      const bookmarks = res.bookmarks || [];

      bookmarks.unshift({
        id: Date.now(),
        title: tab.title,
        url: tab.url,
        tags: autoGenerateTags(tab.url, tab.title),
        timestamp: new Date().toISOString()
      });

      chrome.storage.local.set({ bookmarks });
    });
  });
});
