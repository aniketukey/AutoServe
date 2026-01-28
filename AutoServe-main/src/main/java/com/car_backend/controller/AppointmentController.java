package com.car_backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.car_backend.dto.ApproveRejectDto;
import com.car_backend.dto.CreateAppointmentDto;
import com.car_backend.dto.UpdateAppointmentDto;
import com.car_backend.entities.Status;
import com.car_backend.service.AppointmentService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/appointments")
@RequiredArgsConstructor
@Slf4j
public class AppointmentController {
	
	private final AppointmentService appointmentService;
	
	//-----CUSTOMER MAPPING-------
	@PostMapping
	ResponseEntity<?> createAppointment(@Valid @RequestBody CreateAppointmentDto dto){
		log.info("Received request to create appointment for vehicle, {}" , dto.getVehicleId());
		return ResponseEntity.ok(appointmentService.createAppointment(dto));
	}
	
	@PutMapping("/{appointmentId}")
	public ResponseEntity<?> updateAppointment(@PathVariable Long appointmentId, @Valid @RequestBody UpdateAppointmentDto dto){
		log.info("received update appointment request");
		return ResponseEntity.ok(appointmentService.updateAppointment(appointmentId, dto));
	}
	
	@DeleteMapping("/{appointmentId}/cancel")
	public ResponseEntity<?> cancelAppointment(@PathVariable Long appointmentId){
		appointmentService.cancelAppointment(appointmentId);
		return ResponseEntity.noContent().build();
	}
	
	
	@GetMapping("/customer/{customerId}")
	public ResponseEntity<?> getAllAppointmentsByCustomer(@PathVariable Long customerId){
		return ResponseEntity.ok(appointmentService.getAppointmentsByCustomerId(customerId));
	}
	
	@GetMapping("/vehicle/{vehicleId}")
	public ResponseEntity<?> getAppointmentsByVehice(@PathVariable Long vehicleId){
		return ResponseEntity.ok(appointmentService.getAppointmentsByVehicleId(vehicleId));
	}
	
	
	
	//----------MANAGER MAPPING----------
	
	@GetMapping
	ResponseEntity<?> getAllAppointments(){
		return ResponseEntity.ok(appointmentService.getAllAppointments());
	}
	
	@GetMapping("/{appointmentId}")
	ResponseEntity<?> getAppointmentById(@PathVariable Long appointmentId){
		return ResponseEntity.ok(appointmentService.getAppointmentById(appointmentId));
	}
	
	@GetMapping("/pending")
	ResponseEntity<?> getPendingAppointments(){
		return ResponseEntity.ok(appointmentService.findPendingAppointments());
	}
	
	@GetMapping("/status/{status}")
	ResponseEntity<?> getAppointmentsByStatus(@PathVariable Status status){
		return ResponseEntity.ok(appointmentService.getAppointmentsByStatus(status));
	}
	
	@PutMapping("{appointmentId}/approve")
	ResponseEntity<?> rejectAppointment(@PathVariable Long appointmentId){
		return ResponseEntity.ok(appointmentService.approveAppointment(appointmentId));
	}
	
	@PutMapping("{appointmentId}/reject")
	ResponseEntity<?> approveAppointment(@PathVariable Long appointmentId, @Valid @RequestBody ApproveRejectDto dto){
		System.out.println("rejection reason: "+dto.getRejectionReason());
		return ResponseEntity.ok(appointmentService.rejectAppointment(appointmentId, dto.getRejectionReason()));
	}
	
	
	@GetMapping("/status/pending_count")
	ResponseEntity<?> getPendingAppointmentCount(){
		return ResponseEntity.ok(appointmentService.getPendingAppointmentCount());
	}
	
	
	
	//-----------RSA Mapping------------
	
	@GetMapping("/rsa")
	ResponseEntity<?> getAllRsaAppointments(){
		return ResponseEntity.ok(appointmentService.getRsaAppointments());
	}
	
	
	@GetMapping("/rsa/pending")
	ResponseEntity<?> getPendingRsaAppointments(){
		return ResponseEntity.ok(appointmentService.getPendingRsaAppointments());
	}
	
	@GetMapping("/rsa/{status}")
	ResponseEntity<?> getRsaAppointmentsByStatus(@PathVariable Status status){
		return ResponseEntity.ok(appointmentService.getRsaAppointmentsByStatus(status));
	}
	
	@GetMapping("/status/rsa_count")
	ResponseEntity<?> getRsaCount(){
		return ResponseEntity.ok(appointmentService.getRsaCount());
	}
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
}
