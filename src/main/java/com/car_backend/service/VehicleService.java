package com.car_backend.service;

import java.util.List;

import com.car_backend.dto.CreateVehicleDto;
import com.car_backend.dto.VehicleResponseDto;
import com.car_backend.dto.VehicleUpdateDto;

public interface VehicleService {

	VehicleResponseDto createVehicle(CreateVehicleDto dto);

	List<VehicleResponseDto> getVehicles();

	VehicleResponseDto updateVehicle(Long vehicleId, VehicleUpdateDto dto);

	VehicleResponseDto getVehicleById(Long vehicleId);

	VehicleResponseDto getVehicleByRegistration(String licensePlate);

	List<VehicleResponseDto> getCustomerVehicles(Long customerId);

	VehicleResponseDto deleteVehicle(Long vehicleId);

}
