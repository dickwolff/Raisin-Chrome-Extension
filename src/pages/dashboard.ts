import { createElement, waitForElement } from "../helpers";

const showDashboardPage = async (customer: any, i18n: any) => {

    // Wait for page to load.
    await waitForElement("div[class^=styles_interimDashboardDetailsWrapper]");

    // If the script has already run, don't do it again.
    if (document.querySelector("div[data-raisin-addon=dashboard")) {
        return;
    }

    // Check if you are on the account page.
    const dashboardDiv = document.querySelector("div[class^=styles_interimDashboardDetailsWrapper]");

    if (dashboardDiv) {
        // Get the deposits. This response contains interest data
        const authToken = JSON.parse(localStorage.getItem("auth_token")!);
        const depositsResponse = await fetch(`https://api2.weltsparen.de/das/v1/deposits?customer_id=${customer.bac_number}`, {
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
                savingsAccountsTotal.accrued += (parseFloat(deposit.total_accrued_interest_amount?.denomination) || 0);
                savingsAccountsTotal.total += (parseFloat(deposit.total_booked_interest_amount?.denomination) || 0);
            } else {
                depositsAccountsTotal.accrued += (deposit.total_accrued_interest_amount?.denomination || 0);
                depositsAccountsTotal.total += (deposit.total_booked_interest_amount?.denomination || 0);
            }
        }

        const eurNumberFormat = new Intl.NumberFormat(customer.locale, { style: "currency", currency: "EUR", currencyDisplay: "code" });

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

            const accruedInterestParagraphLabel = createElement("p", i18n.interestAccruedThisQuarter, undefined, stylesParagraphClassName);
            const totalInterestPaidParagraphLabel = createElement("p", i18n.totalInterestPaidOut, undefined, stylesParagraphClassName);

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

export {
    showDashboardPage
}
