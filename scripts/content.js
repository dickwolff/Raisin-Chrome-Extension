

const raisinAddon = async function () {
    console.log("Raisin add-on loaded");

    // Wait for page to load.
    await waitForElement(".styles_depositCard___2se71");

    // Check if you are on the account page.
    const accountDivs = document.querySelectorAll(".styles_depositCard___2se71");

    if (accountDivs.length > 0) {

        // Get customer data. This contains the account id.
        const customerResponse = await fetch("https://www.raisin.nl/savingglobal/rest/open_api/v2/customer", {
            method: "GET",
            mode: "no-cors"
        });
        const customer = await customerResponse.json();

        // Get the deposits. This response contains interest data
        const authToken = JSON.parse(localStorage.getItem("auth_token"));
        const depositsResponse = await fetch(`https://api2.weltsparen.de/das/v1/deposits?customer_id=${customer.bac_number}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${authToken.access_token}`
            }
        });
        const deposits = await depositsResponse.json();

        const eurNumberFormat = new Intl.NumberFormat(customer.locale, { style: "currency", currency: "EUR" });

        for (let idx = 0; idx < accountDivs.length; idx++) {

            const accountDiv = accountDivs[idx];
            const depositMatch = deposits.find(d => d.deposit_id === accountDiv.id);

            if (depositMatch) {

                // Add interest to glance view.
                addInterestOverview(accountDiv, depositMatch, eurNumberFormat)

                // Add interest to table.
                addInterestToDetailsTable(accountDiv, depositMatch, eurNumberFormat);
            }
        }
    }
}

function addInterestOverview(accountDiv, depositMatch, eurNumberFormat) {

    const quarterlyInterestSpan = createElement(
        "span",
        `Opgebouwde dit kwartaal: ${eurNumberFormat.format(parseFloat(depositMatch.total_accrued_interest_amount.denomination))}`,
        null,
        "margin-left: 36px; margin-right: 1rem;");

    const totalInterestPaidSpan = createElement(
        "span",
        `Totaal uitbetaalde rente: ${eurNumberFormat.format(parseFloat(depositMatch.total_booked_interest_amount.denomination))}`);

    const lineDiv = createElement(
        "span",
        null,
        "row styles_depositCardMain___3a-Kb",
        "justify-content: flex-start; padding: 0px 20px 15px 100px; font-size: 12px;",
        [quarterlyInterestSpan, totalInterestPaidSpan]);

    accountDiv.insertBefore(lineDiv, accountDiv.childNodes[accountDiv.childNodes.length - 1]);
    accountDiv.childNodes[0].setAttribute("style", "padding-bottom: 0px;");
}

function addInterestToDetailsTable(accountDiv, depositMatch, eurNumberFormat) {

    const detailDiv = document.getElementById(`${depositMatch.deposit_id}-details`);
    detailDiv.onclick = () => {
        setTimeout(() => {

            if (accountDiv.lastChild.className === "styles_detailsInfo___ri_GI") {

                // Interest accrued this quarter.
                const quarterlyInterestLabel = createElement(
                    "div",
                    "Opgebouwd dit kwartaal",
                    "col-sm-4 styles_detailsInfoRowTitle___3N3Fe",
                    null);

                const quarterlyInterestValue = createElement(
                    "div",
                    eurNumberFormat.format(parseFloat(depositMatch.total_accrued_interest_amount.denomination)),
                    "col-sm-8 styles_detailsInfoRowText___1ZVyd",
                    null);

                const quarterlyInterestRow = createElement(
                    "div",
                    null,
                    `row styles_detailsInfoRow___2YWtr ${depositMatch.deposit_id}-interest-row`,
                    null,
                    [quarterlyInterestLabel, quarterlyInterestValue]);

                // Total interest paid.
                const totalInterestPaidLabel = createElement(
                    "div",
                    "Totaal uitbetaalde rente",
                    "col-sm-4 styles_detailsInfoRowTitle___3N3Fe",
                    null);

                const totalInterestPaidValue = createElement(
                    "div",
                    eurNumberFormat.format(parseFloat(depositMatch.total_booked_interest_amount.denomination)),
                    "col-sm-8 styles_detailsInfoRowText___1ZVyd",
                    null);

                const totalInterestPaidRow = createElement(
                    "div",
                    null,
                    `row styles_detailsInfoRow___2YWtr ${depositMatch.deposit_id}-interest-row`,
                    null,
                    [totalInterestPaidLabel, totalInterestPaidValue]);

                // Add to table.
                const tableDiv = accountDiv.childNodes[accountDiv.childNodes.length - 1];
                tableDiv.insertBefore(quarterlyInterestRow, tableDiv.childNodes[6]);
                tableDiv.insertBefore(totalInterestPaidRow, tableDiv.childNodes[7]);
            }
        }, 250);
    }
}

function createElement(type, innerHTML, className, style, children) {

    const element = document.createElement(type);
    element.innerHTML = innerHTML;

    if (className) {
        element.setAttribute("class", className);
    }

    if (style) {
        element.setAttribute("style", style);
    }

    if (children) {
        for (let idx = 0; idx < children.length; idx++) {
            element.appendChild(children[idx]);
        }
    }

    return element;
}

function waitForElement(selector) {
    return new Promise(resolve => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }

        const observer = new MutationObserver(mutations => {
            if (document.querySelector(selector)) {
                observer.disconnect();
                resolve(document.querySelector(selector));
            }
        });

        // If you get "parameter 1 is not of type 'Node'" error, see https://stackoverflow.com/a/77855838/492336
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}

window.onload = () => raisinAddon();
