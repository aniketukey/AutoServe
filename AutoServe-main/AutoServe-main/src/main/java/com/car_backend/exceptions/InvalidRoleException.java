package com.car_backend.exceptions;

@SuppressWarnings("serial")
public class InvalidRoleException extends RuntimeException {
	public InvalidRoleException(String mesg) {
		super(mesg);
	}
}
