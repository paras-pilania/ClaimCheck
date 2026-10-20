package com.claimcheck.service;

import com.claimcheck.model.Claim;
import com.claimcheck.model.ClaimFlag;
import com.claimcheck.model.LineItem;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;

/**
 * Fictional review rules for this educational prototype.
 * The submission deadline is measured from the claim's original submission date.
 */
@Service
public class ClaimRulesService {

    private final int deadlineDays;

    public ClaimRulesService(@Value("${claimcheck.rules.submission-deadline-days:30}") int deadlineDays) {
        this.deadlineDays = deadlineDays;
    }

    public BigDecimal calculateTotal(List<LineItem> items) {
        BigDecimal total = BigDecimal.ZERO;
        for (LineItem item : items) {
            total = total.add(item.getLineTotal());
        }
        return total.setScale(2, RoundingMode.HALF_UP);
    }

    /** Requires calculatedTotal and submittedAt to be set on the claim already. */
    public Set<ClaimFlag> evaluateFlags(Claim claim, LocalDate today) {
        Set<ClaimFlag> flags = EnumSet.noneOf(ClaimFlag.class);
        boolean noItems = claim.getLineItems().isEmpty();
        String invoice = claim.getInvoiceNumber();

        if (invoice == null || invoice.isBlank()
                || claim.getServiceDate() == null
                || claim.getClaimedAmount() == null
                || noItems) {
            flags.add(ClaimFlag.MISSING_INFORMATION);
        }

        if (claim.getClaimedAmount() != null && !noItems
                && claim.getClaimedAmount().compareTo(claim.getCalculatedTotal()) != 0) {
            flags.add(ClaimFlag.AMOUNT_MISMATCH);
        }

        LocalDate serviceDate = claim.getServiceDate();
        if (serviceDate != null) {
            if (serviceDate.isAfter(today)) {
                flags.add(ClaimFlag.FUTURE_SERVICE_DATE);
            }
            LocalDate submittedOn = claim.getSubmittedAt().toLocalDate();
            if (submittedOn.isAfter(serviceDate.plusDays(deadlineDays))) {
                flags.add(ClaimFlag.LATE_SUBMISSION);
            }
        }
        return flags;
    }
}
