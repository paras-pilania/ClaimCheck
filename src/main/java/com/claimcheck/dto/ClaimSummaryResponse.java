package com.claimcheck.dto;

import com.claimcheck.model.ClaimStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record ClaimSummaryResponse(
        Long id,
        String patientName,
        String providerName,
        String invoiceNumber,
        LocalDate serviceDate,
        BigDecimal claimedAmount,
        BigDecimal calculatedTotal,
        ClaimStatus status,
        LocalDateTime submittedAt,
        List<ClaimResponse.FlagResponse> flags) {
}
