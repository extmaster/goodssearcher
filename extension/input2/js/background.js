chrome.action.onClicked.addListener((tab) => {
    if (!tab.id) return;

    // Check if we are on a valid URL
    if (tab.url && (tab.url.startsWith("chrome://") || tab.url.startsWith("edge://") || tab.url.startsWith("about:"))) {
        return;
    }

    // Send message to the active tab to toggle the UI
    chrome.tabs.sendMessage(tab.id, { action: "toggle_search_ui" })
        .catch((err) => {
            console.warn("Could not reach content script. The page might need a refresh.", err);

            // Optional: Programmatically inject if the content script is missing (e.g. right after installation)
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['js/injector.js']
            }).catch(e => console.error("Script injection failed:", e));
        });
});
