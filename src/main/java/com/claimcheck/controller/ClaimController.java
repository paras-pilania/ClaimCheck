package com.claimcheck.controller;

import com.claimcheck.dto.ClaimRequest;
import com.claimcheck.dto.ClaimResponse;
import com.claimcheck.dto.ClaimSummaryResponse;
import com.claimcheck.dto.StatusChangeRequest;
import com.claimcheck.dto.StatusHistoryResponse;
import com.claimcheck.model.ClaimStatus;
import com.claimcheck.service.ClaimService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/claims")
public class ClaimController {

    private final ClaimService claimService;

    public ClaimController(ClaimService claimService) {
        this.claimService = claimService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ClaimResponse create(@Valid @RequestBody ClaimRequest request) {
        return claimService.create(request);
    }

    @GetMapping("/{id}")
    public ClaimResponse get(@PathVariable Long id) {
        return claimService.getById(id);
    }

    @GetMapping
    public List<ClaimSummaryResponse> list(@RequestParam(required = false) ClaimStatus status) {
        return claimService.list(status);
    }

    @PutMapping("/{id}/resubmission")
    public ClaimResponse resubmit(@PathVariable Long id, @Valid @RequestBody ClaimRequest request) {
        return claimService.resubmit(id, request);
    }

    @PatchMapping("/{id}/status")
    public ClaimResponse changeStatus(@PathVariable Long id, @Valid @RequestBody StatusChangeRequest request) {
        return claimService.changeStatus(id, request);
    }

    @GetMapping("/{id}/history")
    public List<StatusHistoryResponse> history(@PathVariable Long id) {
        return claimService.history(id);
    }
}
