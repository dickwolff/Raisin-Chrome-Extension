

const raisinAddon = async function () {
    console.log("Raisin add-on loaded");

    setTimeout(async () => {
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
    }, 2000);

}

function addInterestOverview(accountDiv, depositMatch, eurNumberFormat) {

    var quarterlyInterestSpan = document.createElement('span');
    quarterlyInterestSpan.innerHTML = `Opgebouwde dit kwartaal: ${eurNumberFormat.format(parseFloat(depositMatch.total_accrued_interest_amount.denomination))}`;
    quarterlyInterestSpan.setAttribute("style", "margin-left: 36px; margin-right: 1rem;");

    var totalInterestPaidSpan = document.createElement('span');
    totalInterestPaidSpan.innerHTML = `Totaal uitbetaalde rente: ${eurNumberFormat.format(parseFloat(depositMatch.total_booked_interest_amount.denomination))}`;
    totalInterestPaidSpan.setAttribute("style", "");

    const lineDiv = document.createElement("div");
    lineDiv.setAttribute("class", "row styles_depositCardMain___3a-Kb");
    lineDiv.setAttribute("style", "justify-content: flex-start; padding: 0px 20px 15px 100px; font-size: 12px;")
    lineDiv.appendChild(quarterlyInterestSpan);
    lineDiv.appendChild(totalInterestPaidSpan);
    accountDiv.insertBefore(lineDiv, accountDiv.childNodes[accountDiv.childNodes.length - 1]);

    accountDiv.childNodes[0].setAttribute("style", "padding-bottom: 0px;");
}

function addInterestToDetailsTable(accountDiv, depositMatch, eurNumberFormat) {

    const detailDiv = document.getElementById(`${depositMatch.deposit_id}-details`);
    detailDiv.onclick = () => {
        setTimeout(() => {

            const quarterlyInterestLabel = document.createElement("div");
            quarterlyInterestLabel.setAttribute("class", "col-sm-4 styles_detailsInfoRowTitle___3N3Fe");
            quarterlyInterestLabel.innerHTML = "Opgebouwd dit kwartaal";

            const quarterlyInterestValue = document.createElement("div");
            quarterlyInterestValue.setAttribute("class", "col-sm-8 styles_detailsInfoRowText___1ZVyd");
            quarterlyInterestValue.innerHTML = eurNumberFormat.format(parseFloat(depositMatch.total_accrued_interest_amount.denomination));

            const quarterlyInterestRow = document.createElement("div");
            quarterlyInterestRow.setAttribute("class", "row styles_detailsInfoRow___2YWtr");
            quarterlyInterestRow.appendChild(quarterlyInterestLabel);
            quarterlyInterestRow.appendChild(quarterlyInterestValue);

            const totalInterestPaidLabel = document.createElement("div");
            totalInterestPaidLabel.setAttribute("class", "col-sm-4 styles_detailsInfoRowTitle___3N3Fe");
            totalInterestPaidLabel.innerHTML = "Totaal uitbetaalde rente";

            const totalInterestPaidValue = document.createElement("div");
            totalInterestPaidValue.setAttribute("class", "col-sm-8 styles_detailsInfoRowText___1ZVyd");
            totalInterestPaidValue.innerHTML = eurNumberFormat.format(parseFloat(depositMatch.total_booked_interest_amount.denomination));

            const totalInterestPaidRow = document.createElement("div");
            totalInterestPaidRow.setAttribute("class", "row styles_detailsInfoRow___2YWtr");
            totalInterestPaidRow.appendChild(totalInterestPaidLabel);
            totalInterestPaidRow.appendChild(totalInterestPaidValue);

            const tableDiv = accountDiv.childNodes[accountDiv.childNodes.length - 1];
            tableDiv.insertBefore(quarterlyInterestRow, tableDiv.childNodes[6]);
            tableDiv.insertBefore(totalInterestPaidRow, tableDiv.childNodes[7]);
        }, 500);
    }
}

window.onload = () => raisinAddon();;