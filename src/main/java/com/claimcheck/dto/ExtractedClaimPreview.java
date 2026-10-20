package com.claimcheck.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Suggested values only. Nothing is saved; submit a reviewed copy to POST /api/claims.
 */
public record ExtractedClaimPreview(
        String patientName,
        String providerName,
        String invoiceNumber,
        LocalDate serviceDate,
        BigDecimal claimedAmount,
        List<ExtractedLineItem> lineItems,
        String notice) {

    public record ExtractedLineItem(
            String description,
            Integer quantity,
            BigDecimal unitPrice) {
    }
}
