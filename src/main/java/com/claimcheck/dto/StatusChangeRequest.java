package com.claimcheck.dto;

import com.claimcheck.model.ClaimStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record StatusChangeRequest(
        @NotNull ClaimStatus status,
        @Size(max = 500) String note,
        @NotNull Long version) {
}
