package com.car_backend.service;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.car_backend.dto.invoice.CreatePaymentOrderResponseDto;
import com.car_backend.dto.invoice.InvoiceItemDto;
import com.car_backend.dto.invoice.InvoiceResponseDto;
import com.car_backend.dto.invoice.PaymentVerificationResponseDto;
import com.car_backend.dto.invoice.VerifyPaymentRequestDto;
import com.car_backend.entities.Appointment;
import com.car_backend.entities.Invoice;
import com.car_backend.entities.JobCard;
import com.car_backend.entities.JobCardItem;
import com.car_backend.entities.JobCardStatus;
import com.car_backend.entities.PaymentMethod;

import com.car_backend.entities.PaymentStatus;
import com.car_backend.entities.User;
import com.car_backend.entities.Vehicle;
import com.car_backend.exceptions.InvalidOperationException;
import com.car_backend.exceptions.PaymentException;
import com.car_backend.exceptions.ResourceNotFoundException;
import com.car_backend.repository.InvoiceRepository;
import com.car_backend.repository.JobCardRepository;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j

public class InvoiceServiceImpl implements InvoiceService {

	private final InvoiceRepository invoiceRepo;
	private final JobCardRepository jobCardRepo;
	private final RazorpayClient razorpayClient;
	private final PdfService pdfService;

	@Value("${razorpay.key.id}")
	private String razorpayKeyId;

	@Value("${razorpay.key.secret}")
	private String razorpayKeySecret;

	@Value("${invoice.tax.percentage}")
	private Double taxPercentage;

	@Override
	public InvoiceResponseDto generateInvoice(Long jobCardId) {
		JobCard jobCard = jobCardRepo.findById(jobCardId)
				.orElseThrow(() -> new ResourceNotFoundException("job card not found."));

		if (jobCard.getJobCardStatus() != JobCardStatus.COMPLETED) {
			throw new InvalidOperationException("cannot generate invoice for imcomplete job cards.");
		}

		if (invoiceRepo.existsByJobCardId(jobCardId)) {
			return mapToResponseDto(invoiceRepo.findByJobCardId(jobCardId).get());
		}

		Double partsAmount = jobCard.getItems().stream().mapToDouble(JobCardItem::getTotalPrice).sum();
		Double laborCost = jobCard.getLaborCost() != null ? jobCard.getLaborCost() : 0.0;
		Double baseAmount = partsAmount + laborCost;

		Double taxAmount = (baseAmount * taxPercentage) / 100.0;
		Double totalAmount = baseAmount + taxAmount;

		String invoiceNumber = generateInvoiceNumber();

		Invoice invoice = new Invoice();
		invoice.setInvoiceNumber(invoiceNumber);
		invoice.setBaseAmount(partsAmount);
		invoice.setLaborCost(laborCost);
		invoice.setTaxPercentage(taxPercentage);
		invoice.setTaxAmount(taxAmount);
		invoice.setTotalAmount(totalAmount);
		invoice.setPaymentStatus(PaymentStatus.PENDING);
		invoice.setJobCard(jobCard);

		Invoice saved = invoiceRepo.save(invoice);
		log.info("invoice generated for job Card : {} ", jobCardId);

		return mapToResponseDto(saved);
	}

	@Override
	public InvoiceResponseDto getInvoice(Long invoiceId) {
		Invoice invoice = invoiceRepo.findById(invoiceId)
				.orElseThrow(() -> new ResourceNotFoundException("invoice " + invoiceId + " not found"));

		return mapToResponseDto(invoice);
	}

	@Override
	public InvoiceResponseDto getInvoiceByNumber(String invoiceNumber) {
		if (!invoiceRepo.existsByInvoiceNumber(invoiceNumber)) {
			throw new ResourceNotFoundException("invoice does not exist with invoice number: " + invoiceNumber);
		}

		Invoice invoice = invoiceRepo.findByInvoiceNumber(invoiceNumber);

		return mapToResponseDto(invoice);
	}

	@Override
	public InvoiceResponseDto getInvoiceByJobCard(Long jobCardId) {

		Optional<Invoice> invoice = invoiceRepo.findByJobCardId(jobCardId);

		if (invoice.isPresent()) {
			return mapToResponseDto(invoice.get());
		}

		boolean jobCardExists = jobCardRepo.existsById(jobCardId);

		if (!jobCardExists) {
			throw new ResourceNotFoundException("job card : " + jobCardId + " does not exist.");
		} else {
			JobCard jobCard = jobCardRepo.findById(jobCardId).get();
			if (jobCard.getJobCardStatus() == com.car_backend.entities.JobCardStatus.COMPLETED) {
				log.info("Proactively generating invoice for completed job card: {}", jobCardId);
				return generateInvoice(jobCardId);
			}
			throw new ResourceNotFoundException("Invoice has not been generated for job card: " + jobCardId);
		}

	}

	@Override
	public List<InvoiceResponseDto> getAllInvoices() {
		List<Invoice> invoices = invoiceRepo.findAll();
		return invoices.stream().map(this::mapToResponseDto).collect(Collectors.toList());
	}

	@Override
	public List<InvoiceResponseDto> getInvoicesByCustomerId(Long customerId) {
		List<Invoice> invoices = invoiceRepo.findByCustomerId(customerId);
		return invoices.stream().map(this::mapToResponseDto).collect(Collectors.toList());
	}

	@Override
	public List<InvoiceResponseDto> getInvoicesByStatus(PaymentStatus status) {
		List<Invoice> invoices = invoiceRepo.findByPaymentStatus(status);
		return invoices.stream().map(this::mapToResponseDto).collect(Collectors.toList());
	}

	@Override
	public CreatePaymentOrderResponseDto createPaymentDto(Long invoiceId) {
		Invoice invoice = invoiceRepo.findById(invoiceId)
				.orElseThrow(() -> new ResourceNotFoundException("Invoice: " + invoiceId + " not found."));

		if (invoice.getPaymentStatus() == PaymentStatus.PAID) {
			throw new InvalidOperationException("Invoice already exists.");
		}

		// create razorpay order
		try {
			JSONObject orderRequest = new JSONObject();
			orderRequest.put("amount", (int) (invoice.getTotalAmount() * 100));
			orderRequest.put("currency", "INR");
			orderRequest.put("receipt", invoice.getInvoiceNumber());

			JSONObject notes = new JSONObject();
			notes.put("invoice_id", invoice.getId());
			notes.put("invoice_number", invoice.getInvoiceNumber());
			notes.put("job_card_id", invoice.getJobCard().getId());
			orderRequest.put("notes", notes);

			Order order = razorpayClient.orders.create(orderRequest);

			invoice.setRazorpayOrderId(order.get("id"));
			invoice.setPaymentStatus(PaymentStatus.INITIATED);
			invoiceRepo.save(invoice);

			User customer = invoice.getJobCard().getAppointment().getVehicleDetails().getCustomer();

			log.info("razorpay order created: {} for invoice {}", order.get("id"), invoice.getInvoiceNumber());

			return CreatePaymentOrderResponseDto.builder()
					.orderId(order.get("id"))
					.invoiceId(invoice.getId())
					.invoiceNumber(invoice.getInvoiceNumber())
					.amount(invoice.getTotalAmount())
					.currency("INR")
					.customerName(customer.getUserName())
					.customerEmail(customer.getEmail())
					.customerPhone(customer.getMobile())
					.razorpayKey(razorpayKeyId)
					.build();

		} catch (RazorpayException e) {
			log.error("razorpay order creation failed. ", e);
			throw new PaymentException("failed to create payment order: " + e.getMessage());
		}

	}

	@Override
	public PaymentVerificationResponseDto verifyPayment(Long invoiceId, VerifyPaymentRequestDto request) {
		try {
			log.info("Starting payment verification for invoiceId: {}. Request: {}", invoiceId, request);

			Invoice invoice = invoiceRepo.findById(invoiceId)
					.orElseThrow(() -> new ResourceNotFoundException("Invoice : " + invoiceId + " not found."));

			// Robust null checks
			if (invoice.getRazorpayOrderId() == null) {
				log.error("Invoice {} has no Razorpay Order ID recorded.", invoiceId);
				return PaymentVerificationResponseDto.builder().verified(false)
						.message("System error: Invoice is missing order reference.").build();
			}

			if (request.getRazorpayOrderId() == null || request.getRazorpayPaymentId() == null
					|| request.getRazorpaySignature() == null) {
				log.error("Payment request for invoice {} is missing data.", invoiceId);
				return PaymentVerificationResponseDto.builder().verified(false)
						.message("Payment information is incomplete.").build();
			}

			if (!invoice.getRazorpayOrderId().equals(request.getRazorpayOrderId())) {
				log.error("Order id mismatch. Expected: {} . Got: {} ", invoice.getRazorpayOrderId(),
						request.getRazorpayOrderId());
				return PaymentVerificationResponseDto.builder().verified(false).message("Order ID mismatch").build();
			}

			String generatedSignature = calculateRazorpaySignature(request.getRazorpayOrderId(),
					request.getRazorpayPaymentId());

			if (!generatedSignature.equals(request.getRazorpaySignature())) {
				log.warn("Signature verification failed for invoice {}", invoiceId);
				invoice.setPaymentStatus(PaymentStatus.FAILED);
				invoiceRepo.save(invoice);
				return PaymentVerificationResponseDto.builder().verified(false).message("Invalid payment signature")
						.build();
			}

			invoice.setRazorpayPaymentId(request.getRazorpayPaymentId());
			invoice.setRazorpaySignature(request.getRazorpaySignature());

			if (request.getPaymentMethod() != null) {
				try {
					invoice.setPaymentMethod(PaymentMethod.valueOf(request.getPaymentMethod().toUpperCase()));
				} catch (Exception e) {
					log.warn("Could not map payment method: {}. Defaulting to ONLINE", request.getPaymentMethod());
					invoice.setPaymentMethod(PaymentMethod.ONLINE);
				}
			}

			invoice.setPaymentStatus(PaymentStatus.PAID);
			invoice.setPaidAt(LocalDateTime.now());

			Invoice updated = invoiceRepo.save(invoice);
			log.info("Payment verified successfully for invoice {}", invoice.getInvoiceNumber());

			InvoiceResponseDto mappedResponse = null;
			try {
				mappedResponse = mapToResponseDto(updated);
			} catch (Exception e) {
				log.warn("Mapping failed after successful payment: {}", e.getMessage());
			}

			return PaymentVerificationResponseDto.builder().verified(true).message("Payment Successful")
					.invoice(mappedResponse).build();

		} catch (ResourceNotFoundException e) {
			throw e;
		} catch (Exception e) {
			log.error("Unexpected error in payment verification: ", e);
			throw new PaymentException("Verification failed: " + e.getMessage());
		}
	}

	// -------------stats implementation

	@Override
	public long getTotalInvoicesCount() {

		return invoiceRepo.count();
	}

	@Override
	public long getPendingPaymentCount() {

		return invoiceRepo.countByPaymentStatus(PaymentStatus.PENDING);
	}

	@Override
	public long getPaidInvoicesCount() {
		return invoiceRepo.countByPaymentStatus(PaymentStatus.PAID);
	}

	@Override
	public Double getTotalRevenue() {
		List<Invoice> invoices = invoiceRepo.findByPaymentStatus(PaymentStatus.PAID);
		return invoices.stream().mapToDouble(Invoice::getTotalAmount).sum();
	}

	@Override
	public Double getRevenueByManager(Long managerId) {
		Double revenue = invoiceRepo.calculateRevenueByManagerId(managerId);
		return revenue != null ? revenue : 0.0;
	}

	@Override
	public Double getPendingRevenue() {
		List<Invoice> invoices = invoiceRepo.findByPaymentStatus(PaymentStatus.PENDING);
		return invoices.stream().mapToDouble(Invoice::getTotalAmount).sum();
	}

	@Override
	public PaymentVerificationResponseDto simulatePayment(Long invoiceId) {
		log.info("Simulating payment for invoice ID: {}", invoiceId);
		Invoice invoice = invoiceRepo.findById(invoiceId)
				.orElseThrow(() -> new ResourceNotFoundException("Invoice not found"));

		if (invoice.getPaymentStatus() == PaymentStatus.PAID) {
			return PaymentVerificationResponseDto.builder()
					.verified(true)
					.message("Invoice already paid.")
					.invoice(mapToResponseDto(invoice))
					.build();
		}

		invoice.setPaymentStatus(PaymentStatus.PAID);
		invoice.setPaymentMethod(PaymentMethod.SIMULATED);
		invoice.setPaidAt(LocalDateTime.now());
		Invoice updated = invoiceRepo.save(invoice);

		log.info("Invoice {} marked as PAID via simulation.", invoiceId);
		return PaymentVerificationResponseDto.builder()
				.verified(true)
				.message("Payment Simulated Successfully")
				.invoice(mapToResponseDto(updated))
				.build();
	}

	// -------------Helper Methods-----------------

	// calculate razorpay signature
	private String calculateRazorpaySignature(String orderId, String paymentId) {
		try {
			String payload = orderId + "|" + paymentId;

			Mac mac = Mac.getInstance("HmacSHA256");
			if (razorpayKeySecret == null) {
				throw new PaymentException("Razorpay Key Secret is not configured in properties.");
			}
			SecretKeySpec secretKeySpec = new SecretKeySpec(razorpayKeySecret.getBytes(StandardCharsets.UTF_8),
					"HmacSHA256");

			mac.init(secretKeySpec);

			byte[] hash = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));

			return bytesToHex(hash);
		} catch (Exception e) {
			throw new PaymentException("Failed to calculate signature." + e.getMessage());
		}
	}

	// convert bytes to hex
	private String bytesToHex(byte[] bytes) {
		StringBuilder result = new StringBuilder();
		for (byte b : bytes) {
			result.append(String.format("%02x", b));
		}
		return result.toString();
	}

	// generate unique invoice number: INV-2024-001
	private String generateInvoiceNumber() {
		String year = String.valueOf(LocalDate.now().getYear());

		long count = invoiceRepo.count() + 1;

		return String.format("INV-%s-%04d", year, count);
	}

	private InvoiceResponseDto mapToResponseDto(Invoice invoice) {
		JobCard jobCard = invoice.getJobCard();
		Appointment appointment = jobCard != null ? jobCard.getAppointment() : null;
		Vehicle vehicle = appointment != null ? appointment.getVehicleDetails() : null;
		User customer = vehicle != null ? vehicle.getCustomer() : null;

		List<InvoiceItemDto> itemDto = (jobCard != null && jobCard.getItems() != null) ? jobCard.getItems().stream()
				.map(item -> InvoiceItemDto.builder()
						.itemName(item.getSnapshotItemName())
						.itemPrice(item.getSnapshotPrice())
						.quantity(item.getQuantity())
						.totalPrice(item.getTotalPrice())
						.build())
				.collect(Collectors.toList()) : List.of();

		return InvoiceResponseDto.builder()
				.id(invoice.getId())
				.invoiceNumber(invoice.getInvoiceNumber())
				.jobCardId(jobCard != null ? jobCard.getId() : null)
				.jobCardStatus(jobCard != null ? jobCard.getJobCardStatus().name() : null)
				.customerId(customer != null ? customer.getId() : null)
				.customerName(customer != null ? customer.getUserName() : "Unknown")
				.customerEmail(customer != null ? customer.getEmail() : null)
				.customerPhone(customer != null ? customer.getMobile() : null)
				.vehicleRegistration(vehicle != null ? vehicle.getLicensePlate() : null)
				.vehicleBrand(vehicle != null ? vehicle.getBrand() : null)
				.vehicleModel(vehicle != null ? vehicle.getModel() : null)
				.baseAmount(invoice.getBaseAmount())
				.laborCost(invoice.getLaborCost())
				.taxPercentage(invoice.getTaxPercentage())
				.taxAmount(invoice.getTaxAmount())
				.totalAmount(invoice.getTotalAmount())
				.paymentStatus(invoice.getPaymentStatus())
				.razorpayOrderId(invoice.getRazorpayOrderId())
				.razorpayPaymentId(invoice.getRazorpayPaymentId())
				.paymentMethod(invoice.getPaymentMethod() != null ? invoice.getPaymentMethod().name() : null)
				.paidAt(invoice.getPaidAt())
				.items(itemDto)
				.createdAt(invoice.getCreatedOn())
				.updatedAt(invoice.getLastUpdated())
				.build();
	}

	@Override
	public byte[] getInvoicePdf(Long invoiceId) {
		Invoice invoice = invoiceRepo.findById(invoiceId)
				.orElseThrow(() -> new ResourceNotFoundException("Invoice: " + invoiceId + " not found."));
		return pdfService.generateInvoicePdf(invoice);
	}

}
