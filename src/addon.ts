import { i18n } from "./i18n";
import { showProductsPage } from "./pages/products";
import { showDashboardPage } from "./pages/dashboard";
import { observeUrlChange, waitForElement } from "./helpers";
import { showMyInvestmentsPage } from "./pages/myinvestments";

class RaisinAddon {

    private initialized: boolean = false;

    private customer: any;

    private i18n: any;

    public async initialize(accountNumber: string) {

        if (this.initialized) {
            return;
        }

        // Set initialized, so it doesn't run again.
        this.initialized = true;

        // Set customer data if not already set.
        await this.setInitialUserData(accountNumber);

        // Subscribe to route changes so the scripts can run on their respective pages.
        observeUrlChange((url: string) => this.showCurrentPage(url));

        // Show current page.
        this.showCurrentPage(window.location.href);

        // We're done, add-on loaded.
        console.log("Raisin add-on loaded!");
    }

    private async showCurrentPage(route: string) {

        route = route.toLocaleLowerCase();

        // Run different scripts on every route.
        if (route.indexOf("myinvestments") > -1) {
            showMyInvestmentsPage(this.customer, this.i18n);
        } else if (route.indexOf("dashboard") > -1) {
            showDashboardPage(this.customer, this.i18n);
        } else if (route.indexOf("products") > -1) {
            showProductsPage(this.i18n);
        }
    }

    private async setInitialUserData(accountNumber: string) {

        // If customer and i18n already loaded, don't do it again.
        if (this.customer && this.i18n) {
            return;
        }

        // Set the customer account number.
        this.customer = {
            bac_number: accountNumber,
        }

        // Try to determine what language the user is has.
        // As this is no longer exposed via an API interface, we have to determine it from the UI.
        // For this, the available balance is used, as it is displayed in the user's language.
        // This is then used to determine the language of the user.
        // This is a bit of a hack, but it works (for now).

        await waitForElement("div[class^=BalanceContainer]");
        const balanceContainer = document.querySelector("div[class^=BalanceContainer]");
        const availableBalanceSpan = `${balanceContainer?.childNodes[1].childNodes[0].textContent?.toLocaleLowerCase()}`;

        if (availableBalanceSpan.indexOf("verfügbar") > -1) {
            this.i18n = i18n["de"];
        }
        else if (availableBalanceSpan.indexOf("available") > -1) {
            this.i18n = i18n["en"];
        }
        else if (availableBalanceSpan.indexOf("disponibile") > -1) {
            this.i18n = i18n["es"];
        }
        else if (availableBalanceSpan.indexOf("beschikbaar") > -1) {
            this.i18n = i18n["nl"];
        }
        else {

            // Otherwise default to English.
            this.i18n = i18n["en"];
        }
    }
}

export {
    RaisinAddon
}
