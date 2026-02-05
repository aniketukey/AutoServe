package com.car_backend.exceptions;

@SuppressWarnings("serial")
public class DuplicateJobCreationException extends RuntimeException {
	public DuplicateJobCreationException(String mesg) {
		super(mesg);
	}
}
