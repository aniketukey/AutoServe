package com.car_backend.exceptions;

@SuppressWarnings("serial")
public class UnauthorizedException extends RuntimeException {
	public UnauthorizedException(String mesg) {
		super(mesg);
	}
}
