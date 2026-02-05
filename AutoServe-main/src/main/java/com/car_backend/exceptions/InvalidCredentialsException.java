package com.car_backend.exceptions;

@SuppressWarnings("serial")
public class InvalidCredentialsException extends RuntimeException {
	
	public InvalidCredentialsException(String msg) {
		
		super(msg);
		
	}

}
