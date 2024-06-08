import { Time, createChart } from "lightweight-charts";

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

                // Add transaction history graph.
                addTransactionHistoryGraph(accountDiv, accountDiv.id, eurNumberFormat);
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

const addTransactionHistoryGraph = async (accountDiv: Element, accountId: string, eurNumberFormat: Intl.NumberFormat) => {


    const toggleButtonsDiv = accountDiv.querySelector("div[class*=styles_toggleButtons]");
    const toggleButtonsClassName = toggleButtonsDiv?.querySelector("span[class*=styles_toggleButton_]")?.className;

    const graphButtonTextSpan = createElement("span", "Grafiek");
    const graphButton = createElement(
        "span",
        undefined,
        `${accountId}-graph`,
        toggleButtonsClassName,
        undefined,
        [graphButtonTextSpan]);
    graphButton.setAttribute("role", "button");
    toggleButtonsDiv?.firstElementChild?.appendChild(graphButton);

    graphButton.onclick = async () => {

        // Check if the graph was already shown, hide if true.
        const graphElement = accountDiv.querySelector(`div[id=${accountId}-graphview`);
        if (graphElement) {
            graphElement.parentElement?.removeChild(graphElement);
            return;
        }

        // Update de view.
        updateView(accountDiv, accountId);

        // Make button active.
        graphButton.setAttribute("style", "border-bottom: 2px solid;");
        graphButton.setAttribute("class", `${toggleButtonsClassName} styles_toggleButtonExpanded`);

        // Check if the tranactions element was shown, hide if true.
        const detailsElement = accountDiv.querySelector("div[class^='styles_detailsInfo'");
        if (detailsElement) {
            detailsElement.setAttribute("style", "display: none");
        }

        // Check if the tranactions element was shown, hide if true.
        const transactionsElement = accountDiv.querySelector("div[class^='styles_ordersTable'");
        if (transactionsElement) {
            transactionsElement.setAttribute("style", "display: none");
        }

        const graphViewDiv = createElement(
            "div",
            undefined,
            `${accountId}-graphview`,
            undefined,
            "padding: 10px 25px;");
        accountDiv.appendChild(graphViewDiv);

        const authToken = JSON.parse(localStorage.getItem("auth_token")!);
        const depositsResponse = await fetch(`https://api2.weltsparen.de/das/v1/deposits/${accountId}/transactions`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${authToken.access_token}`,
            },
        });
        let transactions: RaisinTransaction[] = await depositsResponse.json();
        transactions = transactions.sort((a, b) => new Date(a.value_date).getTime() - new Date(b.value_date).getTime());

        const transactionHistoryChart = createChart(graphViewDiv, {
            height: 300,
            autoSize: true,
            crosshair: {
                horzLine: {
                    visible: true,
                    labelVisible: true
                },
                vertLine: {
                    visible: true,
                    labelVisible: true
                }
            }
        });
        const lineSeries = transactionHistoryChart.addLineSeries();

        let prevValue = 0;
        const lineSeriesData: { time: Time, value: number, action: string }[] = [];
        for (let idx = 0; idx < transactions.length; idx++) {
            const transaction = transactions[idx];
            prevValue += parseFloat(transaction.amount.denomination);

            lineSeriesData.push({
                time: new Date(transaction.value_date).toISOString().split("T")[0],
                value: prevValue,
                action: transaction.type
            });
        }
        lineSeries.setData(lineSeriesData);
        console.log(lineSeriesData)
        transactionHistoryChart.timeScale().fitContent();


        // Create and style the tooltip html element
        const toolTip = document.createElement('div');
        toolTip.setAttribute("style", "width: 128px; height: 96px; position: absolute; display: none; padding: 8px; box-sizing: border-box; font-size: 12px; text-align: left; z-index: 1000; top: 12px; left: 12px; pointer-events: none; border: 1px solid; border-radius: 2px;font-family: -apple-system, BlinkMacSystemFont, 'Trebuchet MS', Roboto, Ubuntu, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; background: white; color: black; border-color: #2962FF;");
        graphViewDiv.appendChild(toolTip);

        transactionHistoryChart.subscribeCrosshairMove((param: any) => {
            if (
                param.point === undefined ||
                !param.time ||
                param.point.x < 0 ||
                param.point.y < 0
            ) {
                toolTip.style.display = 'none';
            } else {
                toolTip.style.display = 'block';
                const data = param.seriesData.get(lineSeries);
                const dataMatch = lineSeriesData.find(t => t.time === data.time && t.value === data.value);

                let label = "";
                switch (dataMatch?.action) {
                    case "PAY IN":
                        label = _i18n.chartLabelPayIn;
                        break;
                    case "TOPUP":
                        label = _i18n.chartLabelTopup;
                        break;
                    case "WITHDRAWAL":
                        label = _i18n.chartLabelWithdrawal;
                        break;
                    case "INTEREST BOOKING":
                        label = _i18n.chartLabelInterest;
                        break;
                }

                toolTip.innerHTML =
                    `<div style="color: ${'#2962FF'}">${label}</div><div style="font-size: 24px; margin: 4px 0px; color: ${'black'}">
                    ${eurNumberFormat.format(dataMatch?.value!)}
                    </div><div style="color: ${'black'}">
                    ${dataMatch?.time}
                    </div>`;
                // Position tooltip according to mouse cursor position
                toolTip.style.left = param.point.x + 'px';
                toolTip.style.top = param.point.y + 'px';
            }
        })
    }

    // Add event handlers on the other buttons.

    const detailsButton = accountDiv.querySelector(`span[id*=${accountId}-details]`);
    (detailsButton as HTMLInputElement).onclick = () => {
        updateView(accountDiv, accountId);
    }

    const transactionsButton = accountDiv.querySelector(`span[id*=${accountId}-transactions]`);
    (transactionsButton as HTMLInputElement).onclick = () => {
        updateView(accountDiv, accountId);
    }
}

const updateView = (accountDiv: Element, accountId: string) => {

    // Check if the graph was already shown, hide if true.
    const graphElement = accountDiv.querySelector(`div[id=${accountId}-graphview`);
    if (graphElement) {
        graphElement.parentElement?.removeChild(graphElement);
    }

    // Remove active border on button.
    const activeButton = document.querySelector(`span[class*=styles_toggleButtonExpanded]`);
    if (activeButton) {
        const normalButtonClassName = document.querySelector(`span[class*=styles_toggleButton_]`)?.className!;
        activeButton.setAttribute("class", normalButtonClassName);
        activeButton.removeAttribute("style");
    }
}


export {
    showMyInvestmentsPage
}
