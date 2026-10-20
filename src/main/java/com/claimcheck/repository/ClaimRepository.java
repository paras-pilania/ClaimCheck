package com.claimcheck.repository;

import com.claimcheck.model.Claim;
import com.claimcheck.model.ClaimStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ClaimRepository extends JpaRepository<Claim, Long> {

    boolean existsByPatientNameIgnoreCaseAndProviderNameIgnoreCaseAndInvoiceNumberIgnoreCase(
            String patientName, String providerName, String invoiceNumber);

    boolean existsByPatientNameIgnoreCaseAndProviderNameIgnoreCaseAndInvoiceNumberIgnoreCaseAndIdNot(
            String patientName, String providerName, String invoiceNumber, Long id);

    List<Claim> findAllByOrderByIdDesc();

    List<Claim> findByStatusOrderByIdDesc(ClaimStatus status);
}
