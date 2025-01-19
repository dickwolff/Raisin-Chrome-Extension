
chrome.webRequest.onBeforeRequest.addListener((details) => {

    // Check if the URL contains the account number.
    if (details.url.indexOf("/customers/BAC_") > -1) {

        // Get the account number from the URL.
        const accountMatch = details.url.match(/BAC_(\d+)_\d+_\d+_\d+/);

        // Send the account number to the content script.
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (isRaisinTab(tabs[0]?.url) && tabs[0]?.id) {
                chrome.tabs.sendMessage(tabs[0].id, { accountNumber: accountMatch?.[0] });
            }
        });

        function isRaisinTab(url: string | undefined): boolean {
            return !!url && (url.indexOf("raisin") > -1 || url.indexOf("weltsparen") > -1);
        }
    }
}, { urls: ["https://api2.weltsparen.de/*"] });

chrome.runtime.onStartup.addListener(() => {
    console.log("Raisin add-on background loaded!");
});
