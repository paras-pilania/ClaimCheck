package com.claimcheck.service;

import com.claimcheck.dto.ClaimResponse;
import com.claimcheck.dto.ClaimSummaryResponse;
import com.claimcheck.dto.StatusHistoryResponse;
import com.claimcheck.model.Claim;
import com.claimcheck.model.StatusHistory;

import java.util.List;

final class ClaimMapper {

    private ClaimMapper() {
    }

    static ClaimResponse toResponse(Claim claim) {
        List<ClaimResponse.LineItemResponse> items = claim.getLineItems().stream()
                .map(i -> new ClaimResponse.LineItemResponse(
                        i.getId(), i.getDescription(), i.getQuantity(), i.getUnitPrice(), i.getLineTotal()))
                .toList();
        return new ClaimResponse(
                claim.getId(),
                claim.getVersion(),
                claim.getPatientName(),
                claim.getProviderName(),
                claim.getInvoiceNumber(),
                claim.getServiceDate(),
                claim.getClaimedAmount(),
                claim.getCalculatedTotal(),
                claim.getStatus(),
                claim.getSubmittedAt(),
                claim.getUpdatedAt(),
                toFlags(claim),
                items);
    }

    static ClaimSummaryResponse toSummary(Claim claim) {
        return new ClaimSummaryResponse(
                claim.getId(),
                claim.getPatientName(),
                claim.getProviderName(),
                claim.getInvoiceNumber(),
                claim.getServiceDate(),
                claim.getClaimedAmount(),
                claim.getCalculatedTotal(),
                claim.getStatus(),
                claim.getSubmittedAt(),
                toFlags(claim));
    }

    static StatusHistoryResponse toHistory(StatusHistory h) {
        return new StatusHistoryResponse(h.getFromStatus(), h.getToStatus(), h.getNote(), h.getChangedAt());
    }

    private static List<ClaimResponse.FlagResponse> toFlags(Claim claim) {
        return claim.getFlags().stream()
                .sorted()
                .map(f -> new ClaimResponse.FlagResponse(f.name(), f.getDescription()))
                .toList();
    }
}
