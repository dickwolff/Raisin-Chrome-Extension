import { RaisinAddon } from "./addon";

chrome.runtime.onMessage.addListener((message, _, __) => {
    if (message.accountNumber) {

        let ra = new RaisinAddon();
        ra.initialize(message.accountNumber);

        console.log("Raisin add-on loaded!");
    }
});
