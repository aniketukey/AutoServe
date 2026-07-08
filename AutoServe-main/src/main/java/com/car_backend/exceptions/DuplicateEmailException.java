package com.car_backend.exceptions;

@SuppressWarnings("serial")
public class DuplicateEmailException extends Exception {
	
	public DuplicateEmailException(String msg) {
		super(msg);
	}

}
