package com.car_backend.exceptions;

@SuppressWarnings("serial")
public class InvalidOperationException extends RuntimeException {
	public InvalidOperationException(String mesg) {
		super(mesg);
	}
}
