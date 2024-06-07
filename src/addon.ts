import { observeUrlChange } from "./helpers";
import { i18n } from "./i18n";
import { showDashboardPage } from "./pages/dashboard";
import { showMyInvestmentsPage } from "./pages/myinvestments";
import { showProductsPage } from "./pages/products";

class RaisinAddon {

    private customer: any;

    private i18n: any;

    public async initialize() {

        // Subscribe to route changes so the scripts can run on their respective pages.
        observeUrlChange((url: string) => this.showCurrentPage(url));

        // Show current page.
        this.showCurrentPage(window.location.href);
    }

    private async showCurrentPage(route: string) {

        // Load customer data if not already loaded.
        await this.loadInitialUserData();

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

    private async loadInitialUserData() {

        // If customer and i18n already loaded, don't do it again.
        if (this.customer && this.i18n) {
            return;
        }

        // Get customer data. This contains the account id.
        const customerResponse = await fetch("https://www.raisin.nl/savingglobal/rest/open_api/v2/customer", {
            method: "GET",
            mode: "no-cors",
        });
        this.customer = await customerResponse.json();

        // Check the user's locale. Set it to the default locale if it is also supported by the add-on.
        const customerLocale = `${this.customer.locale}`.toLocaleLowerCase();
        if (Object.hasOwn(i18n, customerLocale)) {
            this.i18n = i18n[customerLocale];
        } else {
            // Otherwise default to English.
            this.i18n = i18n["en"];
        }
    }
}

export {
    RaisinAddon
}
