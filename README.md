# Raisin add-on Chrome Extension

[![Github-sponsors](https://img.shields.io/badge/sponsor-30363D?style=for-the-badge&logo=GitHub-Sponsors&logoColor=#EA4AAA)](https://github.com/sponsors/dickwolff) &nbsp;
[![BuyMeACoffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-ffdd00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://www.buymeacoffee.com/dickw0lff)

An extension that adds a few things to the [Raisin](https://raisin.com) UI. Works in any Chrome based browser.

[![Download in the Chrome Web Store](https://developer.chrome.com/static/docs/webstore/branding/image/206x58-chrome-web-bcb82d15b2486.png)](https://chromewebstore.google.com/detail/raisin-add-on/babbbcheilomdpnkhecakajnojfbcphg)

_This extension is not affiliated with Raisin. However, if you don't have a Raisin account, please consider using my [referral](https://www.raisin.nl/referral/?raf=d5f9d6f44d10492eb05de42674ea748d4c24330f)._

## What does it to?

Raisin returns your accrued interest in their response body. They do however not show it. This extension does! You can also add a name to your saving accounts. The extension utlilizes [`chrome.storage.sync`](https://developer.chrome.com/docs/extensions/reference/api/storage?hl=nl#property-sync) to sync the names to your other devices.

The extension runs only on specific pages. It retrieves data from the Raisin API. It re-uses your current authorization context once to retrieve your account data, for locale and Account ID. The Account ID is needed to retrieve your savings/deposits account and transaction data. This result contains your interest data. This is done for each relevant page, so you always have the most up to date info. The interest data is then shown on the page. The transactions are shown in a graph.

## How to use

### Install into browser

The easiest way to use the extension is to head to the [Chrome Web Store](https://chromewebstore.google.com/detail/raisin-add-on/babbbcheilomdpnkhecakajnojfbcphg) and install the extension there.

### Run locally

1. Clone/download this repository.
2. Open the cloned/downloaded repository in VSCode.
3. Open the terminal inside VSCode and run `npm run build`. This compiles the extension code to plain JavaScript and puts it in the `/dist` folder.
4. Head to your browser and type `chrome://extensions` in the address bar.
5. Ensure you have enabled Developer Mode (the toggle is on the top-right of the browser).
6. Click on the button that says `Load unpacked`.
7. Navigate to the folder where you stored the repo (step 1).
8. Select the `/dist` folder (don't go in it!).
9. The extension is loaded!

![Locally run extension](img/local.png)

Should you want to make changes to the code of the extension, you'll need to update the extension code in Chrome. You can do this on the extensions page by clicking the icon next to the on/off toggle (see image above).
