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

	// -----CUSTOMER MAPPING-------
	@PreAuthorize("hasRole('CUSTOMER')")
	@PostMapping(consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
	ResponseEntity<?> createAppointment(
			@org.springframework.web.bind.annotation.RequestPart("appointment") @Valid CreateAppointmentDto dto,
			@org.springframework.web.bind.annotation.RequestPart(value = "image", required = false) org.springframework.web.multipart.MultipartFile image) {
		log.info("Received request to create appointment for vehicle, {}", dto.getVehicleId());
		return ResponseEntity.ok(appointmentService.createAppointment(dto, image));
	}

	@PutMapping("/{appointmentId}")
	public ResponseEntity<?> updateAppointment(@PathVariable Long appointmentId,
			@Valid @RequestBody UpdateAppointmentDto dto) {
		log.info("received update appointment request");
		return ResponseEntity.ok(appointmentService.updateAppointment(appointmentId, dto));
	}

	@PreAuthorize("hasAnyRole('CUSTOMER','ADMIN')")
	@DeleteMapping("/{appointmentId}/cancel")
	public ResponseEntity<?> cancelAppointment(@PathVariable Long appointmentId) {
		appointmentService.cancelAppointment(appointmentId);
		return ResponseEntity.noContent().build();
	}

	@PreAuthorize("hasAnyRole('CUSTOMER','ADMIN')")
	@GetMapping("/customer/{customerId}")
	public ResponseEntity<?> getAllAppointmentsByCustomer(@PathVariable Long customerId) {
		return ResponseEntity.ok(appointmentService.getAppointmentsByCustomerId(customerId));
	}

	@GetMapping("/vehicle/{vehicleId}")
	public ResponseEntity<?> getAppointmentsByVehice(@PathVariable Long vehicleId) {
		return ResponseEntity.ok(appointmentService.getAppointmentsByVehicleId(vehicleId));
	}

	// ----------MANAGER MAPPING----------

	@PreAuthorize("hasAnyRole('MANAGER','ADMIN')")

	@GetMapping
	ResponseEntity<?> getAllAppointments() {
		return ResponseEntity.ok(appointmentService.getAllAppointments());
	}

	@PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
	@GetMapping("/{appointmentId}")
	ResponseEntity<?> getAppointmentById(@PathVariable Long appointmentId) {
		return ResponseEntity.ok(appointmentService.getAppointmentById(appointmentId));
	}

	@PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
	@GetMapping("/pending")
	ResponseEntity<?> getPendingAppointments() {
		return ResponseEntity.ok(appointmentService.findPendingAppointments());
	}

	@PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
	@GetMapping("/status/{status}")
	ResponseEntity<?> getAppointmentsByStatus(@PathVariable Status status) {
		return ResponseEntity.ok(appointmentService.getAppointmentsByStatus(status));
	}

	@PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
	@PutMapping("{appointmentId}/approve")
	ResponseEntity<?> approveAppointment(@PathVariable Long appointmentId) {
		return ResponseEntity.ok(appointmentService.approveAppointment(appointmentId));
	}

	@PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
	@PutMapping("{appointmentId}/reject")
	ResponseEntity<?> rejectAppointment(@PathVariable Long appointmentId, @Valid @RequestBody ApproveRejectDto dto) {
		System.out.println("rejection reason: " + dto.getRejectionReason());
		return ResponseEntity.ok(appointmentService.rejectAppointment(appointmentId, dto.getRejectionReason()));
	}

	@PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
	@GetMapping("/status/pending_count")
	ResponseEntity<?> getPendingAppointmentCount() {
		return ResponseEntity.ok(appointmentService.getPendingAppointmentCount());
	}

	// -----------RSA Mapping------------

	@GetMapping("/rsa")
	ResponseEntity<?> getAllRsaAppointments() {
		return ResponseEntity.ok(appointmentService.getRsaAppointments());
	}

	@GetMapping("/rsa/pending")
	ResponseEntity<?> getPendingRsaAppointments() {
		return ResponseEntity.ok(appointmentService.getPendingRsaAppointments());
	}

	@GetMapping("/rsa/{status}")
	ResponseEntity<?> getRsaAppointmentsByStatus(@PathVariable Status status) {
		return ResponseEntity.ok(appointmentService.getRsaAppointmentsByStatus(status));
	}

	@GetMapping("/status/rsa_count")
	ResponseEntity<?> getRsaCount() {
		return ResponseEntity.ok(appointmentService.getRsaCount());
	}

	@PreAuthorize("hasRole('ADMIN')")
	@PutMapping("/{appointmentId}/assign-manager/{managerId}")
	public ResponseEntity<?> assignManager(@PathVariable("appointmentId") Long appointmentId,
			@PathVariable("managerId") Long managerId) {
		log.info("Request to assign manager {} to appointment {}", managerId, appointmentId);
		return ResponseEntity.ok(appointmentService.assignManager(appointmentId, managerId));
	}

	@PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
	@PutMapping("/{appointmentId}/assign-mechanic/{mechanicId}")
	public ResponseEntity<?> assignMechanic(@PathVariable("appointmentId") Long appointmentId,
			@PathVariable("mechanicId") Long mechanicId) {
		log.info("Request to assign mechanic {} to appointment {}", mechanicId, appointmentId);
		return ResponseEntity.ok(appointmentService.assignMechanic(appointmentId, mechanicId));
	}

	@PreAuthorize("hasAnyRole('MANAGER','ADMIN','MECHANIC')")
	@GetMapping("/mechanic/{mechanicId}")
	public ResponseEntity<?> getAppointmentsByMechanic(@PathVariable("mechanicId") Long mechanicId) {
		log.info("Request for appointments of mechanic {}", mechanicId);
		return ResponseEntity.ok(appointmentService.getAppointmentsByMechanicId(mechanicId));
	}

	@PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
	@GetMapping("/manager/{managerId}")
	public ResponseEntity<?> getAppointmentsByManager(@PathVariable("managerId") Long managerId) {
		log.info("Request for appointments of manager {}", managerId);
		return ResponseEntity.ok(appointmentService.getAppointmentsByManagerId(managerId));
	}

}
