package com.car_backend.exceptions;

@SuppressWarnings("serial")
public class InvalidDateException extends RuntimeException {
	public InvalidDateException(String mesg) {
		super(mesg);
	}
}
