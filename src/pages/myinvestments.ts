import { createElement, hashCode, syncStorage, waitForElement } from "../helpers";

let _i18n: any;

const showMyInvestmentsPage = async (customer: any, i18n: any) => {

    // Store locally for sharing between methods.
    _i18n = i18n;

    // Wait for page to load.
    await waitForElement("div[class^=styles_depositCard]");

    // If the script has already run, don't do it again.
    if (document.querySelector("div[data-raisin-addon=investments")) {
        return;
    }

    // Check if you are on the account page.
    const accountDivs = document.querySelectorAll("div[class^=styles_depositCard]");

    if (accountDivs.length > 0) {

        // Get the deposits. This response contains interest data
        const authToken = JSON.parse(localStorage.getItem("auth_token")!);
        const depositsResponse = await fetch(`https://api2.weltsparen.de/das/v1/deposits?customer_id=${customer.bac_number}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${authToken.access_token}`,
            },
        });
        const deposits: RaisinDeposit[] = await depositsResponse.json();

        const eurNumberFormat = new Intl.NumberFormat(customer.locale, { style: "currency", currency: "EUR" });

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
                addCustomName(accountDiv, depositMatch, localData);

                // Add interest to glance view.
                addInterestOverview(accountDiv, depositMatch, eurNumberFormat);

                // Add interest to table.
                addInterestToDetailsTable(accountDiv, depositMatch, eurNumberFormat);
            }
        }

        // Add attribute marking this function is done.
        accountDivs[0].parentElement?.setAttribute("data-raisin-addon", "investments");
    }
}

const addCustomName = (accountDiv: Element, depositMatch: RaisinDeposit, syncedData: SyncedData) => {
    let labelValue: string | undefined = undefined;

    // Check if a label was set previously, if so store this.
    const accountMatchIdx = syncedData.accounts.findIndex((a) => a.id === hashCode(depositMatch.deposit_id));
    if (accountMatchIdx > -1) {
        labelValue = syncedData.accounts[accountMatchIdx].name;
    }

    const chipSpan = createElement(
        "span",
        labelValue ? labelValue : _i18n.giveNameChip,
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
        const name = prompt(_i18n.giveNameLabel, labelValue);

        // Verify the input.
        if (!name || name.trim().length < 3) {
            alert(_i18n.giveNameLabelLengthError);
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

const addInterestOverview = (accountDiv: Element, depositMatch: RaisinDeposit, eurNumberFormat: Intl.NumberFormat) => {
    const quarterlyInterestSpan = createElement(
        "span",
        `${_i18n.interestAccruedThisQuarter}: ${eurNumberFormat.format(
            parseFloat(depositMatch.total_accrued_interest_amount.denomination)
        )}`,
        undefined,
        undefined,
        "margin-right: 1rem;"
    );

    const totalInterestPaidSpan = createElement(
        "span",
        `${_i18n.totalInterestPaidOut}: ${eurNumberFormat.format(parseFloat(depositMatch.total_booked_interest_amount.denomination))}`
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

    accountDiv.insertBefore(lineDiv, accountDiv.children[1]);
    accountDiv.children[0].setAttribute("style", "padding-bottom: 0px;");
}

const addInterestToDetailsTable = (accountDiv: Element, depositMatch: RaisinDeposit, eurNumberFormat: Intl.NumberFormat) => {
    const detailDiv = document.getElementById(`${depositMatch.deposit_id}-details`);
    detailDiv!.onclick = () => {
        setTimeout(() => {
            if (accountDiv.lastElementChild!.className.startsWith("styles_detailsInfo")) {
                // Interest accrued this quarter.
                const detailsInfoRowTitleClassName = document.querySelector("div[class^='col-sm-4 styles_detailsInfoRowTitle']")?.className;
                const quarterlyInterestLabel = createElement(
                    "div",
                    _i18n.interestAccruedThisQuarter,
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
                const totalInterestPaidLabel = createElement("div", _i18n.totalInterestPaidOut, undefined, detailsInfoRowTitleClassName);

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

export {
    showMyInvestmentsPage
}