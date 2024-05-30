

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

            for (let idx = 0; idx < accountDivs.length; idx++) {

                const accountDiv = accountDivs[idx];
                const depositMatch = deposits.find(d => d.deposit_id === accountDiv.id);

                if (depositMatch) {

                    var quarterlyInterestSpan = document.createElement('span');
                    quarterlyInterestSpan.innerHTML = `Opgebouwde rente dit kwartaal: \&euro; ${parseFloat(depositMatch.total_accrued_interest_amount.denomination).toFixed(2)}`;
                    quarterlyInterestSpan.setAttribute("style", "margin-left: 36px; margin-right: 1rem;");

                    var totalInterestPaidSpan = document.createElement('span');
                    totalInterestPaidSpan.innerHTML = `Totaal uitbetaalde rente: \&euro; ${parseFloat(depositMatch.total_booked_interest_amount.denomination).toFixed(2)}`;
                    totalInterestPaidSpan.setAttribute("style", "");

                    const lineDiv = document.createElement("div");
                    lineDiv.setAttribute("class", "row styles_depositCardMain___3a-Kb");
                    lineDiv.setAttribute("style", "justify-content: flex-start; padding: 0px 20px 15px 100px; font-size: 12px;")
                    lineDiv.appendChild(quarterlyInterestSpan);
                    lineDiv.appendChild(totalInterestPaidSpan);
                    accountDiv.insertBefore(lineDiv, accountDiv.childNodes[accountDiv.childNodes.length -1]);
                }
            }
        }
    }, 2000);

}

window.onload = () => raisinAddon();;