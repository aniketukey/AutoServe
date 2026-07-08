package com.car_backend.service;

import java.util.List;

import com.car_backend.dto.invoice.CreatePaymentOrderResponseDto;
import com.car_backend.dto.invoice.InvoiceResponseDto;
import com.car_backend.dto.invoice.PaymentVerificationResponseDto;
import com.car_backend.dto.invoice.VerifyPaymentRequestDto;
import com.car_backend.entities.PaymentStatus;

public interface InvoiceService {

	InvoiceResponseDto generateInvoice(Long jobCardId);

	InvoiceResponseDto getInvoice(Long invoiceId);

	InvoiceResponseDto getInvoiceByNumber(String invoiceNumber);

	InvoiceResponseDto getInvoiceByJobCard(Long jobCardId);

	List<InvoiceResponseDto> getAllInvoices();

	List<InvoiceResponseDto> getInvoicesByCustomerId(Long customerId);

	List<InvoiceResponseDto> getInvoicesByStatus(PaymentStatus status);

	CreatePaymentOrderResponseDto createPaymentDto(Long invoiceId);

	PaymentVerificationResponseDto verifyPayment(Long invoiceId,  VerifyPaymentRequestDto request);

	long getTotalInvoicesCount();

	long getPendingPaymentCount();

	long getPaidInvoicesCount();

	Double getTotalRevenue();

}
