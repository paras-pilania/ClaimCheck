package com.claimcheck.model;

import jakarta.persistence.CascadeType;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.persistence.Version;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "claims",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_claim_patient_provider_invoice",
                columnNames = {"patient_name", "provider_name", "invoice_number"}))
public class Claim {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Version
    @Column(nullable = false)
    private Long version;

    @Column(name = "patient_name", nullable = false, length = 100)
    private String patientName;

    @Column(name = "provider_name", nullable = false, length = 150)
    private String providerName;

    @Column(name = "invoice_number", length = 50)
    private String invoiceNumber;

    @Column(name = "service_date")
    private LocalDate serviceDate;

    @Column(name = "claimed_amount", precision = 14, scale = 2)
    private BigDecimal claimedAmount;

    @Column(name = "calculated_total", nullable = false, precision = 14, scale = 2)
    private BigDecimal calculatedTotal;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ClaimStatus status;

    @Column(name = "submitted_at", nullable = false, updatable = false)
    private LocalDateTime submittedAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "claim_flags", joinColumns = @JoinColumn(name = "claim_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "flag", nullable = false, length = 40)
    private Set<ClaimFlag> flags = new HashSet<>();

    @OneToMany(mappedBy = "claim", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id ASC")
    private List<LineItem> lineItems = new ArrayList<>();

    @OneToMany(mappedBy = "claim", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id ASC")
    private List<StatusHistory> statusHistory = new ArrayList<>();

    public void addLineItem(LineItem item) {
        lineItems.add(item);
        item.setClaim(this);
    }

    public void addHistory(StatusHistory history) {
        statusHistory.add(history);
        history.setClaim(this);
    }

    public Long getId() {
        return id;
    }

    public Long getVersion() {
        return version;
    }

    public String getPatientName() {
        return patientName;
    }

    public void setPatientName(String patientName) {
        this.patientName = patientName;
    }

    public String getProviderName() {
        return providerName;
    }

    public void setProviderName(String providerName) {
        this.providerName = providerName;
    }

    public String getInvoiceNumber() {
        return invoiceNumber;
    }

    public void setInvoiceNumber(String invoiceNumber) {
        this.invoiceNumber = invoiceNumber;
    }

    public LocalDate getServiceDate() {
        return serviceDate;
    }

    public void setServiceDate(LocalDate serviceDate) {
        this.serviceDate = serviceDate;
    }

    public BigDecimal getClaimedAmount() {
        return claimedAmount;
    }

    public void setClaimedAmount(BigDecimal claimedAmount) {
        this.claimedAmount = claimedAmount;
    }

    public BigDecimal getCalculatedTotal() {
        return calculatedTotal;
    }

    public void setCalculatedTotal(BigDecimal calculatedTotal) {
        this.calculatedTotal = calculatedTotal;
    }

    public ClaimStatus getStatus() {
        return status;
    }

    public void setStatus(ClaimStatus status) {
        this.status = status;
    }

    public LocalDateTime getSubmittedAt() {
        return submittedAt;
    }

    public void setSubmittedAt(LocalDateTime submittedAt) {
        this.submittedAt = submittedAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Set<ClaimFlag> getFlags() {
        return flags;
    }

    public List<LineItem> getLineItems() {
        return lineItems;
    }

    public List<StatusHistory> getStatusHistory() {
        return statusHistory;
    }
}
