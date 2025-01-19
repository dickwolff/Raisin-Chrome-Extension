import { RaisinAddon } from "./addon";

let ra: RaisinAddon;

// Create a new instance of the RaisinAddon when the site is loaded.
window.onload = () => {
    ra = new RaisinAddon();
};

// Listen to messages from the background script.
// The account number is sent from the background script, after which the add-on can be initialized.
chrome.runtime.onMessage.addListener((message, _, __) => {

    // On receiving the account number, initialize the add-on.
    if (message.accountNumber) {
        ra?.initialize(message.accountNumber);
    }
});
