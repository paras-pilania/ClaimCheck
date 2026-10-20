package com.claimcheck.service;

import com.claimcheck.dto.ClaimRequest;
import com.claimcheck.dto.ClaimResponse;
import com.claimcheck.dto.ClaimSummaryResponse;
import com.claimcheck.dto.StatusChangeRequest;
import com.claimcheck.dto.StatusHistoryResponse;
import com.claimcheck.exception.ApiExceptions;
import com.claimcheck.model.Claim;
import com.claimcheck.model.ClaimStatus;
import com.claimcheck.model.LineItem;
import com.claimcheck.model.StatusHistory;
import com.claimcheck.repository.ClaimRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class ClaimService {

    private final ClaimRepository claimRepository;
    private final ClaimRulesService rules;

    public ClaimService(ClaimRepository claimRepository, ClaimRulesService rules) {
        this.claimRepository = claimRepository;
        this.rules = rules;
    }

    @Transactional
    public ClaimResponse create(ClaimRequest request) {
        assertNotDuplicate(request, null);

        LocalDateTime now = LocalDateTime.now();
        Claim claim = new Claim();
        claim.setSubmittedAt(now);
        claim.setUpdatedAt(now);
        claim.setStatus(ClaimStatus.SUBMITTED);
        applyRequest(claim, request);
        claim.addHistory(StatusHistory.of(null, ClaimStatus.SUBMITTED, "Claim submitted", now));

        return ClaimMapper.toResponse(claimRepository.save(claim));
    }

    @Transactional(readOnly = true)
    public ClaimResponse getById(Long id) {
        return ClaimMapper.toResponse(findOrThrow(id));
    }

    @Transactional(readOnly = true)
    public List<ClaimSummaryResponse> list(ClaimStatus status) {
        List<Claim> claims = status == null
                ? claimRepository.findAllByOrderByIdDesc()
                : claimRepository.findByStatusOrderByIdDesc(status);
        return claims.stream().map(ClaimMapper::toSummary).toList();
    }

    @Transactional(readOnly = true)
    public List<StatusHistoryResponse> history(Long id) {
        return findOrThrow(id).getStatusHistory().stream().map(ClaimMapper::toHistory).toList();
    }

    @Transactional
    public ClaimResponse changeStatus(Long id, StatusChangeRequest request) {
        Claim claim = findOrThrow(id);
        assertVersion(claim, request.version());
        ClaimStatus target = request.status();

        if (target == ClaimStatus.SUBMITTED) {
            throw new ApiExceptions.InvalidStatusTransitionException(
                    "Claims return to SUBMITTED only through PUT /api/claims/{id}/resubmission.");
        }
        if (!claim.getStatus().canTransitionTo(target)) {
            throw new ApiExceptions.InvalidStatusTransitionException(
                    "Cannot move from " + claim.getStatus() + " to " + target
                            + ". Allowed next statuses: " + claim.getStatus().allowedNext() + ".");
        }
        if (target == ClaimStatus.NEEDS_INFORMATION
                && (request.note() == null || request.note().isBlank())) {
            throw new ApiExceptions.BadRequestException(
                    "A note is required when moving a claim to NEEDS_INFORMATION.");
        }

        transition(claim, target, blankToNull(request.note()));
        claimRepository.saveAndFlush(claim);
        return ClaimMapper.toResponse(claim);
    }

    @Transactional
    public ClaimResponse resubmit(Long id, ClaimRequest request) {
        if (request.version() == null) {
            throw new ApiExceptions.BadRequestException("version is required when resubmitting a claim.");
        }
        Claim claim = findOrThrow(id);
        assertVersion(claim, request.version());
        if (!claim.getStatus().canTransitionTo(ClaimStatus.SUBMITTED)) {
            throw new ApiExceptions.InvalidStatusTransitionException(
                    "Only claims in NEEDS_INFORMATION can be corrected and resubmitted. Current status: "
                            + claim.getStatus() + ".");
        }
        assertNotDuplicate(request, id);
        applyRequest(claim, request);
        transition(claim, ClaimStatus.SUBMITTED, "Corrected and resubmitted");
        claimRepository.saveAndFlush(claim);
        return ClaimMapper.toResponse(claim);
    }

    private Claim findOrThrow(Long id) {
        return claimRepository.findById(id)
                .orElseThrow(() -> new ApiExceptions.NotFoundException("Claim " + id + " was not found."));
    }

    private void assertVersion(Claim claim, Long expectedVersion) {
        if (!claim.getVersion().equals(expectedVersion)) {
            throw new ApiExceptions.StaleVersionException(
                    "Claim " + claim.getId() + " was modified by someone else (current version "
                            + claim.getVersion() + "). Reload it and try again.");
        }
    }

    private void transition(Claim claim, ClaimStatus target, String note) {
        LocalDateTime now = LocalDateTime.now();
        ClaimStatus from = claim.getStatus();
        claim.setStatus(target);
        claim.setUpdatedAt(now);
        claim.addHistory(StatusHistory.of(from, target, note, now));
    }

    private void applyRequest(Claim claim, ClaimRequest request) {
        claim.setPatientName(request.patientName().trim());
        claim.setProviderName(request.providerName().trim());
        claim.setInvoiceNumber(blankToNull(request.invoiceNumber()));
        claim.setServiceDate(request.serviceDate());
        claim.setClaimedAmount(request.claimedAmount() == null
                ? null
                : request.claimedAmount().setScale(2, RoundingMode.HALF_UP));

        claim.getLineItems().clear();
        if (request.lineItems() != null) {
            for (ClaimRequest.LineItemRequest li : request.lineItems()) {
                LineItem item = new LineItem();
                item.setDescription(li.description().trim());
                item.setQuantity(li.quantity());
                item.setUnitPrice(li.unitPrice().setScale(2, RoundingMode.HALF_UP));
                claim.addLineItem(item);
            }
        }

        claim.setCalculatedTotal(rules.calculateTotal(claim.getLineItems()));
        claim.getFlags().clear();
        claim.getFlags().addAll(rules.evaluateFlags(claim, LocalDate.now()));
    }

    private void assertNotDuplicate(ClaimRequest request, Long excludeId) {
        String invoice = blankToNull(request.invoiceNumber());
        if (invoice == null) {
            return;
        }
        String patient = request.patientName().trim();
        String provider = request.providerName().trim();

        boolean duplicate = excludeId == null
                ? claimRepository.existsByPatientNameIgnoreCaseAndProviderNameIgnoreCaseAndInvoiceNumberIgnoreCase(
                        patient, provider, invoice)
                : claimRepository.existsByPatientNameIgnoreCaseAndProviderNameIgnoreCaseAndInvoiceNumberIgnoreCaseAndIdNot(
                        patient, provider, invoice, excludeId);
        if (duplicate) {
            throw new ApiExceptions.DuplicateClaimException(
                    "A claim with this invoice number already exists for this patient and provider.");
        }
    }

    private static String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
