package com.car_backend.exceptions;

@SuppressWarnings("serial")
public class DuplicateSkuException extends RuntimeException {
	public DuplicateSkuException(String mesg) {
		super(mesg);
	}
}
