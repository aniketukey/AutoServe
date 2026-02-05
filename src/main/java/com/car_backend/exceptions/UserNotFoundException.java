package com.car_backend.exceptions;

@SuppressWarnings("serial")
public class UserNotFoundException extends RuntimeException{
	public UserNotFoundException(String mesg) {
		super(mesg);
	}

}
