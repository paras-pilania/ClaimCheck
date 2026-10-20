package com.claimcheck.controller;

import com.claimcheck.dto.ExtractRequest;
import com.claimcheck.dto.ExtractedClaimPreview;
import com.claimcheck.service.ClaimExtractionService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    private final ClaimExtractionService extractionService;

    public AiController(ClaimExtractionService extractionService) {
        this.extractionService = extractionService;
    }

    /** Preview only. This endpoint never saves a claim. */
    @PostMapping("/extract-claim")
    public ExtractedClaimPreview extract(@Valid @RequestBody ExtractRequest request) {
        return extractionService.extract(request.billText());
    }
}
