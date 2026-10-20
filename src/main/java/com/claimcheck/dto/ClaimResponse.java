package com.claimcheck.dto;

import com.claimcheck.model.ClaimStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record ClaimResponse(
        Long id,
        Long version,
        String patientName,
        String providerName,
        String invoiceNumber,
        LocalDate serviceDate,
        BigDecimal claimedAmount,
        BigDecimal calculatedTotal,
        ClaimStatus status,
        LocalDateTime submittedAt,
        LocalDateTime updatedAt,
        List<FlagResponse> flags,
        List<LineItemResponse> lineItems) {

    public record LineItemResponse(
            Long id,
            String description,
            int quantity,
            BigDecimal unitPrice,
            BigDecimal lineTotal) {
    }

    public record FlagResponse(String code, String message) {
    }
}
