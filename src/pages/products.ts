import { createElement, waitForElement } from "../helpers";

const showProductsPage = async (i18n: any) => {

    // Wait for page to load.
    await waitForElement("div[class^=styles_productsWrapper]");

    // If the script has already run, don't do it again.
    if (document.querySelector("div[data-raisin-addon=products")) {
        return;
    }

    const filtersDiv = document.querySelector("div[class^=styles_filterRow]");

    const inputClassName = document.querySelector("input[class^=styles_checkboxElement]")?.className;
    const noSourceTaxInput = createElement(
        "input",
        undefined,
        "nosourcetax",
        inputClassName);
    noSourceTaxInput.setAttribute("name", "nosourcetax");
    noSourceTaxInput.setAttribute("type", "checkbox");

    const inputLabelClassName = document.querySelector("span[class*=styles_checkboxLarge]")?.className;
    const noSourceTaxInputLabel = createElement(
        "span",
        undefined,
        undefined,
        inputLabelClassName);

    const labelSpan = createElement("span", i18n.noSourceTaxLabel);

    // Show checkbox to filter on source tax, attach click event handler.
    const labelClassName = document.querySelector("label[class*=styles_labelCheckbox]")?.className;
    const label = createElement("label", undefined, undefined, labelClassName, undefined, [noSourceTaxInput, noSourceTaxInputLabel, labelSpan]);
    label.setAttribute("for", "nosourcetax");
    label.onclick = () => {
        setSourceTaxAttribute();
    }

    const inputSpan = createElement("span", undefined, undefined, undefined, undefined, [label]);

    const inputDivClassName = document.querySelector("div[class^=styles_filterTerm]")?.className;
    const inputDiv = createElement("div", undefined, undefined, inputDivClassName, undefined, [inputSpan]);
    filtersDiv?.appendChild(inputDiv);

    // Assign all the attributes.
    setSourceTaxAttribute();

    // Add click handler to load more button. This will also set the attibutes on new loaded offers.
    const loadMoreButtonDiv = document.querySelector("div[class^=styles_loadMore]");
    (loadMoreButtonDiv?.firstElementChild as HTMLInputElement).onclick = () => {
        setSourceTaxAttribute();
    }

    // Add attribute marking this function is done.
    filtersDiv?.setAttribute("data-raisin-addon", "products");
}

const setSourceTaxAttribute = () => {
    setTimeout(() => {
        const offersDivs = document.querySelectorAll("div[id^=offer]");

        // Set the attributes containing the source tax info.
        for (let idx = 0; idx < offersDivs.length; idx++) {
            const offer = offersDivs[idx];

            const hasNoSourceTax = offer.querySelector("span[class*=chipNoTax]");

            offer.setAttribute("data-sourcetax", `${!hasNoSourceTax}`);
        }

        // Hide/show offers depending on which need to be shown.
        const nosourcetaxChecked = (document.querySelector("#nosourcetax") as HTMLInputElement).checked;
        for (let idx = 0; idx < offersDivs.length; idx++) {
            const offer = offersDivs[idx];
            const offerHasSourceTax = offer.getAttribute("data-sourcetax");

            // If source tax should be hidden, and the current offer has source tax, hide it.
            if (nosourcetaxChecked && offerHasSourceTax === "true") {
                offer.setAttribute("style", "display: none");
            } else {
                offer.removeAttribute("style");
            }
        }
    }, 100);
}

export {
    showProductsPage
}
