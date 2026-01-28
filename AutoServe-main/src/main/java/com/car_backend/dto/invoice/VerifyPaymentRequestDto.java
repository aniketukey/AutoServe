package com.car_backend.dto.invoice;

import com.car_backend.entities.PaymentMethod;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data

public class VerifyPaymentRequestDto {
	
	@NotBlank(message="razorpay order id is required.")
	private String razorpayOrderId;
	
	@NotBlank(message="razorpay payment id is required.")
	private String razorpayPaymentId;
	
	@NotBlank(message = "razorpay signature is required.")
	private String razorpaySignature;
	
	private PaymentMethod paymentMethod;
}
