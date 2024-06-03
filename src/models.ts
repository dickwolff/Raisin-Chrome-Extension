interface SyncedData {
    accounts: AccountDetails[]
}

interface AccountDetails {
    id: string;
    name: string;
}

interface RaisinDeposit {
    term: {
        period: string;
    },
    total_accrued_interest_amount: {
        denomination: string;
    },
    total_booked_interest_amount: {
        denomination: string;
    },
    deposit_id: string;
}