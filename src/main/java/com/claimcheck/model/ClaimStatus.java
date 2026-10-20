package com.claimcheck.model;

import java.util.EnumSet;
import java.util.Set;

/**
 * Review workflow status. REVIEWED means the internal review is finished;
 * it does NOT mean an insurer approved or will pay the claim.
 */
public enum ClaimStatus {
    SUBMITTED,
    UNDER_REVIEW,
    NEEDS_INFORMATION,
    REVIEWED;

    public Set<ClaimStatus> allowedNext() {
        return switch (this) {
            case SUBMITTED -> EnumSet.of(UNDER_REVIEW, NEEDS_INFORMATION);
            case UNDER_REVIEW -> EnumSet.of(NEEDS_INFORMATION, REVIEWED);
            case NEEDS_INFORMATION -> EnumSet.of(SUBMITTED);
            case REVIEWED -> EnumSet.noneOf(ClaimStatus.class);
        };
    }

    public boolean canTransitionTo(ClaimStatus next) {
        return allowedNext().contains(next);
    }
}
