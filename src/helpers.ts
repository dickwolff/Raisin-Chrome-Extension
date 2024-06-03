

const syncStorage = (currentData: SyncedData, accountId: string, newLabel: string) => {
    const accountMatchIdx = currentData.accounts.findIndex((a) => a.id === accountId);

    // If it does not exist, create a new record.
    if (accountMatchIdx === -1) {
        currentData.accounts.push({
            id: hashCode(accountId),
            name: newLabel,
        });
    } else {
        // Update the record.
        currentData.accounts[accountMatchIdx].name = newLabel;
    }

    // Sync data to Chrome.
    chrome.storage.sync.set({ raisinAddon: JSON.stringify(currentData) });
}

function hashCode(str: string): string {
    var hash = 0,
        i,
        chr;
    if (str.length === 0) return `${hash}`;
    for (i = 0; i < str.length; i++) {
        chr = str.charCodeAt(i);
        hash = (hash << 5) - hash + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return `${hash}`;
};

function createElement(type: string, innerHTML?: string, id?: string, className?: string, style?: string, children?: any[]) {
    const element = document.createElement(type);

    if (innerHTML != null) {
        element.innerHTML = innerHTML;
    }

    if (id != null) {
        element.setAttribute("id", id);
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

function waitForElement(selector: string) {
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

const observeUrlChange = (callback: CallableFunction) => {
    let oldHref = document.location.href;

    const body = document.querySelector("body");

    const observer = new MutationObserver((_) => {
        if (oldHref !== document.location.href) {
            oldHref = document.location.href;
            callback(oldHref);
        }
    });

    observer.observe(body!, { childList: true, subtree: true });
};

export {
    hashCode,
    syncStorage,
    waitForElement,
    createElement,
    observeUrlChange
}
