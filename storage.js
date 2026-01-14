const STORAGE_KEY = 'bookmarks';

function getBookmarks(callback) {
  chrome.storage.local.get([STORAGE_KEY], (result) => {
    callback(result[STORAGE_KEY] || []);
  });
}

function setBookmarks(bookmarks, callback) {
  chrome.storage.local.set({ [STORAGE_KEY]: bookmarks }, () => {
    if (callback) callback();
  });
}