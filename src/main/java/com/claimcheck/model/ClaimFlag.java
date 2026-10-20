package com.claimcheck.model;

public enum ClaimFlag {
    MISSING_INFORMATION("Invoice number, service date, claimed amount, or line items are missing."),
    AMOUNT_MISMATCH("Claimed amount does not equal the sum of the line items."),
    FUTURE_SERVICE_DATE("Service date is in the future."),
    LATE_SUBMISSION("Claim was submitted after the fictional submission deadline.");

    private final String description;

    ClaimFlag(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
