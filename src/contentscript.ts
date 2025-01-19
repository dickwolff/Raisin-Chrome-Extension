import { RaisinAddon } from "./addon";

// Create a new instance of the RaisinAddon.
const ra = new RaisinAddon();

chrome.runtime.onMessage.addListener((message, _, __) => {
    if (message.accountNumber) {

        // On receiving the account number, initialize the add-on.
        ra.initialize(message.accountNumber);
        
        console.log("Raisin add-on loaded!");
    }
});
