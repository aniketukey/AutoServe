package com.car_backend.exceptions;

@SuppressWarnings("serial")
public class ResourceNotFoundException extends RuntimeException{
	public ResourceNotFoundException(String mesg) {
		super(mesg);
	}
}
