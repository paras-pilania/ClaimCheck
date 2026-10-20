package com.claimcheck.dto;

import com.claimcheck.model.ClaimStatus;

import java.time.LocalDateTime;

public record StatusHistoryResponse(
        ClaimStatus fromStatus,
        ClaimStatus toStatus,
        String note,
        LocalDateTime changedAt) {
}
