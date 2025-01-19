chrome.declarativeNetRequest.onRuleMatchedDebug.addListener((details) => {

    console.log("Network request completed:", details.request);

    // Get the account number from the URL.
    const accountMatch = details.request.url.match(/BAC_(\d+)_\d+_\d+_\d+/);

    // Send the account number to the content script.
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
            console.log("Sending account to content script:", accountMatch?.[0]);
            chrome.tabs.sendMessage(tabs[0].id, { accountNumber: accountMatch?.[0] });
        }
    });
});

console.log("Raisin add-on background loaded!");
