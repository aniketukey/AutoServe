package com.car_backend.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.car_backend.entities.Status;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AppointmentResponseDto {
	private Long id;
	
	private Long vehicleId;
	private String licensePlate;
	private String brand;
	private String model;
	private String color;
	
	private Long customerId;
	private String customerName;
	private String email;
	private String mobile;
	
	private LocalDate requestDate;
	private String problemDescription;
	private String customerPhotoUrl;
	
	private boolean isRsa;
	private String rsaCoordinates;
	private RsaLocationDto rsaLocation;
	
	private Status status;
    private String rejectionReason;
	
	private LocalDateTime createdAt;
	private LocalDateTime updatedAt;
	
}
