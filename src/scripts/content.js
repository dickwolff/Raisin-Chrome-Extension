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
      mode: "no-cors",
    });
    const customer = await customerResponse.json();

    // Check the user's locale. Set it to the default locale if it is also supported by the add-on.
    const customerLocale = `${customer.locale}`.toLocaleLowerCase();
    if (Object.hasOwn(window.raisinAddon.i18n, customerLocale)) {
      window.raisinAddon.i18n = window.raisinAddon.i18n[customerLocale];
    } else {
      // Otherwise default to English.
      window.raisinAddon.i18n = window.raisinAddon.i18n["en"];
    }

    // Get the deposits. This response contains interest data
    const authToken = JSON.parse(localStorage.getItem("auth_token"));
    const depositsResponse = await fetch(`https://api2.weltsparen.de/das/v1/deposits?customer_id=${customer.bac_number}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${authToken.access_token}`,
      },
    });
    const deposits = await depositsResponse.json();

    const eurNumberFormat = new Intl.NumberFormat(customer.locale, { style: "currency", currency: "EUR" });

    // Get user stored data from Chrome sync.
    let dataFromSync = await chrome.storage.sync.get("raisinAddon");
    dataFromSync = Object.hasOwn(dataFromSync, "raisinAddon") ? JSON.parse(dataFromSync.raisinAddon) : { accounts: [] };

    for (let idx = 0; idx < accountDivs.length; idx++) {
      const accountDiv = accountDivs[idx];
      const depositMatch = deposits.find((d) => d.deposit_id === accountDiv.id);

      if (depositMatch) {
        // Add shadow naming
        addCustomName(accountDiv, depositMatch, dataFromSync);

        // Add interest to glance view.
        addInterestOverview(accountDiv, depositMatch, eurNumberFormat);

        // Add interest to table.
        addInterestToDetailsTable(accountDiv, depositMatch, eurNumberFormat);
      }
    }
  }
};

function addCustomName(accountDiv, depositMatch, syncedData) {
  let labelValue = undefined;

  // Check if a label was set previously, if so store this.
  const accountMatchIdx = syncedData.accounts.findIndex((a) => a.id === depositMatch.deposit_id.hashCode());
  if (accountMatchIdx > -1) {
    labelValue = syncedData.accounts[accountMatchIdx].name;
  }

  const chipSpan = createElement(
    "span",
    labelValue ? labelValue : window.raisinAddon.i18n.giveNameChip,
    null,
    null,
    "overflow: hidden; text-overflow: ellipsis; padding-left: 11px; padding-right: 11px; white-space: nowrap;"
  );

  const chipDiv = createElement(
    "div",
    null,
    null,
    null,
    "margin-left: 1rem; border-radius: 4px; height: 24px; max-width: 24rem; display: inline-flex; align-items: center; justify-content: center; font-size: 1rem; border: 1px solid #d7d7d7; " +
      (labelValue ? "background: #f5f5f5;" : "background: transparent"),
    [chipSpan]
  );

  // Add click handler.
  chipDiv.onclick = () => {
    // Create a promt for user to enter or update the name,.
    const name = prompt(window.raisinAddon.i18n.giveNameLabel, labelValue);

    // Verify the input.
    if (name.trim().length < 3) {
      alert(window.raisinAddon.i18n.giveNameLabelLengthError);
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

  accountDiv.firstChild.childNodes[1].setAttribute("style", "display: flex;");
  accountDiv.firstChild.childNodes[1].appendChild(chipDiv);
}

function addInterestOverview(accountDiv, depositMatch, eurNumberFormat) {
  const quarterlyInterestSpan = createElement(
    "span",
    `${window.raisinAddon.i18n.interestAccruedThisQuarter}: ${eurNumberFormat.format(
      parseFloat(depositMatch.total_accrued_interest_amount.denomination)
    )}`,
    null,
    null,
    "margin-right: 1rem;"
  );

  const totalInterestPaidSpan = createElement(
    "span",
    `${window.raisinAddon.i18n.totalInterestPaidOut}: ${eurNumberFormat.format(parseFloat(depositMatch.total_booked_interest_amount.denomination))}`
  );

  const interestDiv = createElement("div", null, null, "styles_mainInfo___3_4uI", "font-size: 12px; padding-top: 0px;", [
    quarterlyInterestSpan,
    totalInterestPaidSpan,
  ]);

  const stylesLogoFillDiv = createElement("div", null, null, "styles_logo___xL43z", "height: 1rem;");

  const lineDiv = createElement("div", null, null, "row styles_depositCardMain___3a-Kb", "justify-content: flex-start; padding-top: 0px;", [
    stylesLogoFillDiv,
    interestDiv,
  ]);

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
          window.raisinAddon.i18n.interestAccruedThisQuarter,
          null,
          "col-sm-4 styles_detailsInfoRowTitle___3N3Fe",
          null
        );

        const quarterlyInterestValue = createElement(
          "div",
          eurNumberFormat.format(parseFloat(depositMatch.total_accrued_interest_amount.denomination)),
          null,
          "col-sm-8 styles_detailsInfoRowText___1ZVyd",
          null
        );

        const quarterlyInterestRow = createElement("div", null, null, "row styles_detailsInfoRow___2YWtr", null, [
          quarterlyInterestLabel,
          quarterlyInterestValue,
        ]);

        // Total interest paid.
        const totalInterestPaidLabel = createElement(
          "div",
          window.raisinAddon.i18n.totalInterestPaidOut,
          null,
          "col-sm-4 styles_detailsInfoRowTitle___3N3Fe",
          null
        );

        const totalInterestPaidValue = createElement(
          "div",
          eurNumberFormat.format(parseFloat(depositMatch.total_booked_interest_amount.denomination)),
          null,
          "col-sm-8 styles_detailsInfoRowText___1ZVyd",
          null
        );

        const totalInterestPaidRow = createElement("div", null, null, "row styles_detailsInfoRow___2YWtr", null, [
          totalInterestPaidLabel,
          totalInterestPaidValue,
        ]);

        // Add to table.
        const tableDiv = accountDiv.childNodes[accountDiv.childNodes.length - 1];
        tableDiv.insertBefore(quarterlyInterestRow, tableDiv.childNodes[6]);
        tableDiv.insertBefore(totalInterestPaidRow, tableDiv.childNodes[7]);
      }
    }, 250);
  };
}

function createElement(type, innerHTML, id, className, style, children) {
  const element = document.createElement(type);
  element.innerHTML = innerHTML;

  if (id != null) {
    element.setAttribute("id", className);
  }

  if (className != null) {
    element.setAttribute("class", className);
  }

  if (style != null) {
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
  return new Promise((resolve) => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector));
    }

    const observer = new MutationObserver((mutations) => {
      if (document.querySelector(selector)) {
        observer.disconnect();
        resolve(document.querySelector(selector));
      }
    });

    // If you get "parameter 1 is not of type 'Node'" error, see https://stackoverflow.com/a/77855838/492336
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  });
}

function syncStorage(currentData, accountId, newLabel) {
  const accountMatchIdx = currentData.accounts.findIndex((a) => a.id === accountId);

  // If it does not exist, create a new record.
  if (accountMatchIdx === -1) {
    currentData.accounts.push({
      id: accountId.hashCode(),
      name: newLabel,
    });
  } else {
    // Update the record.
    currentData.accounts[accountMatchIdx].name = newLabel;
  }

  // Sync data to Chrome.
  chrome.storage.sync.set({ raisinAddon: JSON.stringify(currentData) });
}

window.onload = () => raisinAddon();
