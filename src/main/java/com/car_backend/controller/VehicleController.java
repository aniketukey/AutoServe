package com.car_backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.car_backend.dto.CreateVehicleDto;
import com.car_backend.dto.VehicleUpdateDto;
import com.car_backend.service.VehicleService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/vehicles")
@RequiredArgsConstructor

public class VehicleController {
	
	private final VehicleService vehicleService;
	
//	@PreAuthorize("hasRole('CUSTOMER')")
	@PostMapping
	public ResponseEntity<?> createVehicle(@RequestBody @Valid CreateVehicleDto dto){
		return ResponseEntity.ok(vehicleService.createVehicle(dto));
	}
	
	@PreAuthorize("hasRole('CUSTOMER')")
	@GetMapping
	public ResponseEntity<?> getVehicles(){
		return ResponseEntity.ok(vehicleService.getVehicles());
	}

	@PreAuthorize("hasRole('CUSTOMER')")
	@PutMapping("/{vehicleId}")
	public ResponseEntity<?> updateVehicle(@PathVariable Long vehicleId, @RequestBody @Valid VehicleUpdateDto dto){
		return ResponseEntity.ok(vehicleService.updateVehicle(vehicleId, dto));
	}

	@PreAuthorize("hasAnyRole('CUSTOMER','ADMIN')")
	@GetMapping("/{vehicleId}")
	public ResponseEntity<?> getVehicleById(@PathVariable Long vehicleId){
		return ResponseEntity.ok(vehicleService.getVehicleById(vehicleId));
	}
	
	@GetMapping("/license_plate/{licensePlate}")
	public ResponseEntity<?> getVehicleByLicensePlate(@PathVariable String licensePlate){
		return ResponseEntity.ok(vehicleService.getVehicleByRegistration(licensePlate));
	}
//	@PreAuthorize("hasAnyRole('CUSTOMER','ADMIN')")
//	@PreAuthorize("hasAuthority('ROLE_CUSTOMER')")

	@GetMapping("/customer/{customerId}")
	public ResponseEntity<?> getCustomerVehicles(@PathVariable Long customerId){
		return ResponseEntity.ok(vehicleService.getCustomerVehicles(customerId));
	}

	@PreAuthorize("hasAnyRole('CUSTOMER','ADMIN')")
	@DeleteMapping("/{vehicleId}")
	public ResponseEntity<?> deleteVehicle(@PathVariable Long vehicleId){
		return ResponseEntity.ok(vehicleService.deleteVehicle(vehicleId));
	}
}
