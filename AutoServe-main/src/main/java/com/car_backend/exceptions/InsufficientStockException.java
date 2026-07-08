package com.car_backend.exceptions;

@SuppressWarnings("serial")
public class InsufficientStockException extends RuntimeException {
	public InsufficientStockException(String mesg) {
		super(mesg);
	}
}
