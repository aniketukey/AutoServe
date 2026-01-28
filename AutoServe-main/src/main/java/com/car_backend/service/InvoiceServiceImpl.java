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
import com.car_backend.entities.PaymentStatus;
import com.car_backend.entities.User;
import com.car_backend.entities.Vehicle;
import com.car_backend.exceptions.DuplicateInvoiceException;
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

public class InvoiceServiceImpl implements InvoiceService{
	
	private final InvoiceRepository invoiceRepo;
	private final JobCardRepository jobCardRepo;
	private final RazorpayClient razorpayClient;
	
	@Value("${razorpay.key.id}")
	private String razorpayKeyId;
	
	@Value("${razorpay.key.secret}")
	private String razorpayKeySecret;
	
	@Value("${invoice.tax.percentage}")
	private Double taxPercentage;
	
	
	@Override
	public InvoiceResponseDto generateInvoice(Long jobCardId) {
		JobCard jobCard = jobCardRepo.findById(jobCardId).orElseThrow(()-> new ResourceNotFoundException("job card not found."));
		
		if(jobCard.getJobCardStatus() != JobCardStatus.COMPLETED) {
			throw new InvalidOperationException("cannot generate invoice for imcomplete job cards.");
		}
		
		if(invoiceRepo.existsByJobCardId(jobCardId)) {
			throw new DuplicateInvoiceException("Invoice of job card :"+ jobCardId+" already exists.");
		}
		
		Double baseAmount = jobCard.getItems().stream().mapToDouble(JobCardItem::getTotalPrice).sum();
		
		Double taxAmount = (baseAmount*taxPercentage)/100.0;
		
		Double totalAmount = baseAmount + taxAmount;
		
		String invoiceNumber = generateInvoiceNumber();
		
		Invoice invoice = new Invoice();
		invoice.setInvoiceNumber(invoiceNumber);
		invoice.setBaseAmount(baseAmount);
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
		Invoice invoice = invoiceRepo.findById(invoiceId).orElseThrow(()-> new ResourceNotFoundException("invoice "+ invoiceId+" not found"));
		
		return mapToResponseDto(invoice);
	}
	
	@Override
	public InvoiceResponseDto getInvoiceByNumber(String invoiceNumber) {
		if(!invoiceRepo.existsByInvoiceNumber(invoiceNumber)) {
			throw new ResourceNotFoundException("invoice does not exist with invoice number: "+invoiceNumber);
		}
		
		Invoice invoice = invoiceRepo.findByInvoiceNumber(invoiceNumber);
		
		return mapToResponseDto(invoice);
	}
	
	@Override
	public InvoiceResponseDto getInvoiceByJobCard(Long jobCardId) {
		
		Optional<Invoice> invoice = invoiceRepo.findByJobCardId(jobCardId);
		
		if(invoice.isPresent()) {
			return mapToResponseDto(invoice.get());
		}
		
		boolean jobCardExists = jobCardRepo.existsById(jobCardId);
		
		if(!jobCardExists) {
			throw new ResourceNotFoundException("job card : "+ jobCardId+" does not exist.");
		}else {
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
		Invoice invoice = invoiceRepo.findById(invoiceId).orElseThrow(()-> new ResourceNotFoundException("Invoice: "+invoiceId+" not found."));
		
		if(invoice.getPaymentStatus() == PaymentStatus.PAID) {
			throw new InvalidOperationException("Invoice already exists.");
		}
		
		//create razorpay order
		try {
			JSONObject orderRequest = new JSONObject();
			orderRequest.put("amount", (int)(invoice.getTotalAmount() * 100));
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
			
		}catch(RazorpayException e) {
			log.error("razorpay order creation failed. ",e);
			throw new PaymentException("failed to create payment order: " + e.getMessage());
		}
		
	}
	
	
	@Override
	public PaymentVerificationResponseDto verifyPayment(Long invoiceId, VerifyPaymentRequestDto request) {
		Invoice invoice = invoiceRepo.findById(invoiceId).orElseThrow(()-> new ResourceNotFoundException("Invoice : "+invoiceId+" not found."));
		
		if(!invoice.getRazorpayOrderId().equals(request.getRazorpayOrderId())) {
			log.error("Order id mismatch. Expected: {} . Got: {} ", invoice.getRazorpayOrderId(), request.getRazorpayOrderId());
			
			return PaymentVerificationResponseDto.builder()
					.verified(false)
					.message("order id mismatch")
					.build();
		}
		
		try {
			String generatedSignature = calculateRazorpaySignature(
					request.getRazorpayOrderId(), request.getRazorpayPaymentId()
					);
			
			if(!generatedSignature.equals(request.getRazorpaySignature())){
				log.error("signature verification failed for invoice {} ", invoiceId);
				
				invoice.setPaymentStatus(PaymentStatus.FAILED);
				invoiceRepo.save(invoice);
				
				return PaymentVerificationResponseDto.builder()
						.verified(false)
						.message("Payment signature verification failed")
						.build();
			}
			
			invoice.setRazorpayPaymentId(request.getRazorpayPaymentId());
			invoice.setRazorpaySignature(request.getRazorpaySignature());
			invoice.setPaymentMethod(request.getPaymentMethod());
			invoice.setPaymentStatus(PaymentStatus.PAID);
			invoice.setPaidAt(LocalDateTime.now());
			
			Invoice updated = invoiceRepo.save(invoice);
			
			log.info("Payment verified successfully for invoice {}. PaymentId {}", invoice.getInvoiceNumber(), request.getRazorpayOrderId());
			
			return PaymentVerificationResponseDto.builder()
					.verified(true)
					.message("Payment Successful")
					.invoice(mapToResponseDto(updated))
					.build();
			
			
		}catch(Exception e) {
			log.error("Payment verification logic failed", e);
		    throw new PaymentException("Internal server error during verification");
		}
		
		
	}
	
	
	//-------------stats implementation
	
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

	
	//-------------Helper Methods-----------------
	
	
	//calculate razorpay signature
	private String calculateRazorpaySignature(String orderId, String paymentId) {
		try {
			String payload = orderId + "|" + paymentId;
			
			Mac mac = Mac.getInstance("HmacSHA256");
			SecretKeySpec secretKeySpec = new SecretKeySpec(razorpayKeySecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
			
			mac.init(secretKeySpec);
			
			byte[] hash = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
			
			return bytesToHex(hash);
		}catch(Exception e) {
			throw new PaymentException("Failed to calculate signature."+e.getMessage());
		}
	}
	
	
	//convert bytes to hex
	private String bytesToHex(byte[] bytes) {
		StringBuilder result = new StringBuilder();
		for(byte b: bytes) {
			result.append(String.format("%02x", b));
		}
		return result.toString();
	}
	
	//generate unique invoice number: INV-2024-001
	private String generateInvoiceNumber() {
		String year = String.valueOf(LocalDate.now().getYear());
		
		long count = invoiceRepo.count()+1;
		
		return String.format("INV-%s-%04d", year, count);
	}
	
	private InvoiceResponseDto mapToResponseDto(Invoice invoice) {
		JobCard jobCard = invoice.getJobCard();
		Appointment appointment = jobCard.getAppointment();
		Vehicle vehicle = appointment.getVehicleDetails();
		User customer = vehicle.getCustomer();
		
		List<InvoiceItemDto> itemDto = jobCard.getItems().stream()
				.map(item-> InvoiceItemDto.builder()
						.itemName(item.getSnapshotItemName())
						.itemPrice(item.getSnapshotPrice())
						.quantity(item.getQuantity())
						.totalPrice(item.getTotalPrice())
						.build())
				.collect(Collectors.toList());
		
		return InvoiceResponseDto.builder()
				.id(invoice.getId())
				.invoiceNumber(invoice.getInvoiceNumber())
				.jobCardId(jobCard.getId())
				.jobCardStatus(jobCard.getJobCardStatus().name())
				.customerId(customer.getId())
				.customerName(customer.getUserName())
				.customerEmail(customer.getEmail())
				.customerPhone(customer.getMobile())
				.vehicleRegistration(vehicle.getLicensePlate())
				.vehicleBrand(vehicle.getBrand())
				.vehicleModel(vehicle.getModel())
				.baseAmount(invoice.getBaseAmount())
				.taxPercentage(invoice.getTaxPercentage())
				.taxAmount(invoice.getTaxAmount())
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

	

	
	

	

	

	

	

	


	




	
}
































