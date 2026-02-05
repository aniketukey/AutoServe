package com.car_backend.exceptions;

@SuppressWarnings("serial")
public class StockConflictException extends RuntimeException {
	public StockConflictException(String mesg) {
		super(mesg);
	}
}
