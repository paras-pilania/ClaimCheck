package com.claimcheck.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Patient and provider names are required. Other fields may be omitted;
 * omissions are flagged as MISSING_INFORMATION instead of rejected.
 * Amounts must be greater than zero.
 * "version" is required only for resubmission (it must match the claim's current version)
 * and is ignored on create.
 */
public record ClaimRequest(
        @NotBlank @Size(max = 100) String patientName,
        @NotBlank @Size(max = 150) String providerName,
        @Size(max = 50) String invoiceNumber,
        LocalDate serviceDate,
        @Positive @Digits(integer = 10, fraction = 2) BigDecimal claimedAmount,
        @Size(max = 100) List<@NotNull @Valid LineItemRequest> lineItems,
        Long version) {

    public record LineItemRequest(
            @NotBlank @Size(max = 200) String description,
            @NotNull @Min(1) @Max(1000) Integer quantity,
            @NotNull @Positive @Digits(integer = 6, fraction = 2) BigDecimal unitPrice) {
    }
}
