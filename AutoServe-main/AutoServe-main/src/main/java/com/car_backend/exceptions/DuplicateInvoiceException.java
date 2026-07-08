package com.car_backend.exceptions;

@SuppressWarnings("serial")
public class DuplicateInvoiceException extends RuntimeException {
	public DuplicateInvoiceException(String mesg) {
		super(mesg);
	}
}
