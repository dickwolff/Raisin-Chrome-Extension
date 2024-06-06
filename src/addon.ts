import { createElement, hashCode, observeUrlChange, syncStorage, waitForElement } from "./helpers";
import { i18n } from "./i18n";

class RaisinAddon {

    private customer: any;

    private i18n: any;

    public async initialize() {

        // Subscribe to route changes so the scripts can run on their respective pages.
        observeUrlChange((url: string) => this.showCurrentPage(url));

        // Show current page.
        this.showCurrentPage(window.location.href);
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

    private showCurrentPage(route: string) {

        route = route.toLocaleLowerCase();

        // Run different scripts on every route.
        if (route.indexOf("myinvestments") > -1) {
            this.showMyInvestmentsPage();
        } else if (route.indexOf("dashboard") > -1) {
            this.showDashboardPage();
        }
    }

    private async showMyInvestmentsPage() {
        // Wait for page to load.
        await waitForElement("div[class^=styles_depositCard]");

        // If the script has already run, don't do it again.
        if (document.querySelector("div[data-raisin-addon=investments")) {
            return;
        }

        // Load customer data if not already loaded.
        await this.loadInitialUserData();

        // Check if you are on the account page.
        const accountDivs = document.querySelectorAll("div[class^=styles_depositCard]");

        if (accountDivs.length > 0) {

            // Get the deposits. This response contains interest data
            const authToken = JSON.parse(localStorage.getItem("auth_token")!);
            const depositsResponse = await fetch(`https://api2.weltsparen.de/das/v1/deposits?customer_id=${this.customer.bac_number}`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${authToken.access_token}`,
                },
            });
            const deposits: RaisinDeposit[] = await depositsResponse.json();

            const eurNumberFormat = new Intl.NumberFormat(this.customer.locale, { style: "currency", currency: "EUR" });

            // Get user stored data from Chrome sync.
            let localData: SyncedData = { accounts: [] };
            let dataFromSync = await chrome.storage.sync.get("raisinAddon");
            if (Object.hasOwn(dataFromSync, "raisinAddon")) {
                localData = JSON.parse(dataFromSync.raisinAddon);
            }

            for (let idx = 0; idx < accountDivs.length; idx++) {
                const accountDiv = accountDivs[idx];
                const depositMatch = deposits.find((d: RaisinDeposit) => d.deposit_id === accountDiv.id);

                if (depositMatch) {
                    // Add shadow naming
                    this.addCustomName(accountDiv, depositMatch, localData);

                    // Add interest to glance view.
                    this.addInterestOverview(accountDiv, depositMatch, eurNumberFormat);

                    // Add interest to table.
                    this.addInterestToDetailsTable(accountDiv, depositMatch, eurNumberFormat);
                }
            }

            // Add attribute marking this function is done.
            accountDivs[0].parentElement?.setAttribute("data-raisin-addon", "investments");
        }
    }


    private async showDashboardPage() {
        // Wait for page to load.
        await waitForElement("div[class^=styles_interimDashboardDetailsWrapper]");

        // If the script has already run, don't do it again.
        if (document.querySelector("div[data-raisin-addon=dashboard")) {
            return;
        }

        // Load customer data if not already loaded.
        await this.loadInitialUserData();

        // Check if you are on the account page.
        const dashboardDiv = document.querySelector("div[class^=styles_interimDashboardDetailsWrapper]");

        if (dashboardDiv) {
            // Get the deposits. This response contains interest data
            const authToken = JSON.parse(localStorage.getItem("auth_token")!);
            const depositsResponse = await fetch(`https://api2.weltsparen.de/das/v1/deposits?customer_id=${this.customer.bac_number}`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${authToken.access_token}`,
                },
            });
            const deposits = await depositsResponse.json();

            let savingsAccountsTotal = {
                accrued: 0,
                total: 0,
            };
            let depositsAccountsTotal = {
                accrued: 0,
                total: 0,
            };

            const hasNoSavingsAccounts = deposits.find((a: RaisinDeposit) => a.term.period == "UNDEFINED") === undefined;
            const hasNoDepositAccounts = deposits.find((a: RaisinDeposit) => a.term.period != "UNDEFINED") === undefined;

            for (let idx = 0; idx < deposits.length; idx++) {
                let deposit = deposits[idx];

                // Savings don't have a period.
                if (deposit.term.period == "UNDEFINED") {
                    savingsAccountsTotal.accrued += parseFloat(deposit.total_accrued_interest_amount.denomination);
                    savingsAccountsTotal.total += parseFloat(deposit.total_booked_interest_amount.denomination);
                } else {
                    depositsAccountsTotal.accrued += deposit.total_accrued_interest_amount.denomination;
                    depositsAccountsTotal.total += deposit.total_booked_interest_amount.denomination;
                }
            }

            const eurNumberFormat = new Intl.NumberFormat(this.customer.locale, { style: "currency", currency: "EUR", currencyDisplay: "code" });

            const dashboardRows = dashboardDiv?.firstElementChild?.lastElementChild?.children;

            const detailsRow = document.querySelector("div[class^='styles_categoryDetailsRow_']");
            const detailsRowClassName = detailsRow?.className;
            const stylesParagraphClassName = detailsRow?.firstElementChild?.className;

            for (let idx = 0; idx < dashboardRows!.length; idx++) {
                const currentRow = dashboardRows![idx];

                // If no deposits accounts, don't add the interest.
                if (idx === 0 && hasNoDepositAccounts) {
                    continue;
                }

                // If no savings accounts, don't add the interest.
                if (idx === 1 && hasNoSavingsAccounts) {
                    continue;
                }

                // First row is for deposits, second for savings. Take the corresponding data object.
                const data = idx === 0 ? depositsAccountsTotal : savingsAccountsTotal;

                const accruedInterestParagraphLabel = createElement("p", this.i18n.interestAccruedThisQuarter, undefined, stylesParagraphClassName);
                const totalInterestPaidParagraphLabel = createElement("p", this.i18n.totalInterestPaidOut, undefined, stylesParagraphClassName);

                const accruedInterestParagraphValue = createElement("p", eurNumberFormat.format(data.accrued), undefined, stylesParagraphClassName);
                const totalInterestPaidParagraphValue = createElement("p", eurNumberFormat.format(data.total), undefined, stylesParagraphClassName);

                const accruedInterestRow = createElement(
                    "div",
                    undefined,
                    undefined,
                    detailsRowClassName,
                    "display: grid; grid-auto-flow: column; grid-template-columns: 14rem 8rem; grid-template-rows: 3rem 3rem; font-size: 1.25rem; border-top: none;",
                    [accruedInterestParagraphLabel, totalInterestPaidParagraphLabel, accruedInterestParagraphValue, totalInterestPaidParagraphValue]
                );

                currentRow.appendChild(accruedInterestRow);
            }
            
            // Add attribute marking this function is done.
            dashboardDiv.setAttribute("data-raisin-addon", "dashboard");
        }
    }

    private addCustomName(accountDiv: Element, depositMatch: RaisinDeposit, syncedData: SyncedData) {
        let labelValue: string | undefined = undefined;

        // Check if a label was set previously, if so store this.
        const accountMatchIdx = syncedData.accounts.findIndex((a) => a.id === hashCode(depositMatch.deposit_id));
        if (accountMatchIdx > -1) {
            labelValue = syncedData.accounts[accountMatchIdx].name;
        }

        const chipSpan = createElement(
            "span",
            labelValue ? labelValue : this.i18n.giveNameChip,
            undefined,
            undefined,
            "overflow: hidden; text-overflow: ellipsis; padding-left: 11px; padding-right: 11px; white-space: nowrap;"
        );

        const chipDiv = createElement(
            "div",
            undefined,
            undefined,
            undefined,
            "margin-left: 1rem; border-radius: 4px; height: 24px; max-width: 24rem; display: inline-flex; align-items: center; justify-content: center; font-size: 1rem; border: 1px solid #d7d7d7; " +
            (labelValue ? "background: #f5f5f5;" : "background: transparent"),
            [chipSpan]
        );

        // Add click handler.
        chipDiv.onclick = () => {
            // Create a promt for user to enter or update the name,.
            const name = prompt(this.i18n.giveNameLabel, labelValue);

            // Verify the input.
            if (!name || name.trim().length < 3) {
                alert(this.i18n.giveNameLabelLengthError);
                return;
            }

            // Update local storage.
            syncStorage(syncedData, depositMatch.deposit_id, name);

            // Update the values on the screen.
            chipSpan.innerHTML = name;
            labelValue = name;

            // Update css.
            chipDiv.setAttribute(
                "style",
                "margin-left: 1rem; border-radius: 4px; height: 24px; max-width: 24rem; display: inline-flex; align-items: center; justify-content: center; font-size: 1rem; border: 1px solid #d7d7d7; " +
                (labelValue ? "background: #f5f5f5;" : "background: transparent;")
            );
        };

        accountDiv.firstElementChild!.children[1].setAttribute("style", "display: flex;");
        accountDiv.firstElementChild!.children[1].appendChild(chipDiv);
    }

    private addInterestOverview(accountDiv: Element, depositMatch: RaisinDeposit, eurNumberFormat: Intl.NumberFormat) {
        const quarterlyInterestSpan = createElement(
            "span",
            `${this.i18n.interestAccruedThisQuarter}: ${eurNumberFormat.format(
                parseFloat(depositMatch.total_accrued_interest_amount.denomination)
            )}`,
            undefined,
            undefined,
            "margin-right: 1rem;"
        );

        const totalInterestPaidSpan = createElement(
            "span",
            `${this.i18n.totalInterestPaidOut}: ${eurNumberFormat.format(parseFloat(depositMatch.total_booked_interest_amount.denomination))}`
        );

        const mainInfoClassName = document.querySelector("div[class^=styles_mainInfo]")?.className;
        const interestDiv = createElement("div", undefined, undefined, mainInfoClassName, "font-size: 12px; padding-top: 0px;", [
            quarterlyInterestSpan,
            totalInterestPaidSpan,
        ]);

        const logoClassName = document.querySelector("div[class^=styles_logo]")?.className;
        const stylesLogoFillDiv = createElement("div", undefined, undefined, logoClassName, "height: 1rem;");

        const depositCardMainClassName = document.querySelector("div[class^='row styles_depositCardMain']")?.className;
        const lineDiv = createElement("div", undefined, undefined, depositCardMainClassName, "justify-content: flex-start; padding-top: 0px;", [
            stylesLogoFillDiv,
            interestDiv,
        ]);

        accountDiv.insertBefore(lineDiv, accountDiv.children[accountDiv.children.length - 1]);
        accountDiv.children[0].setAttribute("style", "padding-bottom: 0px;");
    }

    private addInterestToDetailsTable(accountDiv: Element, depositMatch: RaisinDeposit, eurNumberFormat: Intl.NumberFormat) {
        const detailDiv = document.getElementById(`${depositMatch.deposit_id}-details`);
        detailDiv!.onclick = () => {
            setTimeout(() => {
                if (accountDiv.lastElementChild!.className.startsWith("styles_detailsInfo")) {
                    // Interest accrued this quarter.
                    const detailsInfoRowTitleClassName = document.querySelector("div[class^='col-sm-4 styles_detailsInfoRowTitle']")?.className;
                    const quarterlyInterestLabel = createElement(
                        "div",
                        this.i18n.interestAccruedThisQuarter,
                        undefined,
                        detailsInfoRowTitleClassName);

                    const detailsInfoRowTextClassName = document.querySelector("div[class^='col-sm-8 styles_detailsInfoRowText']")?.className;
                    const quarterlyInterestValue = createElement(
                        "div",
                        eurNumberFormat.format(parseFloat(depositMatch.total_accrued_interest_amount.denomination)),
                        undefined,
                        detailsInfoRowTextClassName);

                    const detailsInfoRowClassName = document.querySelector("div[class^='row styles_detailsInfoRow']")?.className;
                    const quarterlyInterestRow = createElement("div", undefined, undefined, detailsInfoRowClassName, undefined, [
                        quarterlyInterestLabel,
                        quarterlyInterestValue,
                    ]);

                    // Total interest paid.
                    const totalInterestPaidLabel = createElement("div", this.i18n.totalInterestPaidOut, undefined, detailsInfoRowTitleClassName);

                    const totalInterestPaidValue = createElement(
                        "div",
                        eurNumberFormat.format(parseFloat(depositMatch.total_booked_interest_amount.denomination)),
                        undefined,
                        detailsInfoRowTextClassName);

                    const totalInterestPaidRow = createElement("div", undefined, undefined, detailsInfoRowClassName, undefined, [
                        totalInterestPaidLabel,
                        totalInterestPaidValue,
                    ]);

                    // Add to table.
                    const tableDiv = accountDiv.children[accountDiv.children.length - 1];
                    tableDiv.insertBefore(quarterlyInterestRow, tableDiv.children[6]);
                    tableDiv.insertBefore(totalInterestPaidRow, tableDiv.children[7]);
                }
            }, 250);
        };
    }
}

export {
    RaisinAddon
}
