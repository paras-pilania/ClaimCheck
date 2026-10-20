package com.claimcheck.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ExtractRequest(
        @NotBlank @Size(max = 10000) String billText) {
}
