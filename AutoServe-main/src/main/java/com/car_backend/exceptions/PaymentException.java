package com.car_backend.exceptions;

@SuppressWarnings("serial")
public class PaymentException extends RuntimeException {
	public PaymentException(String mesg) {
		super(mesg);
	}
}
