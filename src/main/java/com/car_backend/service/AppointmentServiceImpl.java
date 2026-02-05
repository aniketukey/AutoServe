package com.car_backend.service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.car_backend.dto.AppointmentResponseDto;
import com.car_backend.dto.CreateAppointmentDto;
import com.car_backend.dto.RsaLocationDto;
import com.car_backend.dto.UpdateAppointmentDto;
import com.car_backend.entities.Appointment;
import com.car_backend.entities.Status;
import com.car_backend.entities.User;
import com.car_backend.entities.Vehicle;
import com.car_backend.exceptions.InvalidDateException;
import com.car_backend.exceptions.InvalidOperationException;
import com.car_backend.exceptions.ResourceNotFoundException;
import com.car_backend.repository.AppointmentRepository;
import com.car_backend.repository.UserRepository;
import com.car_backend.repository.VehicleRepository;
import com.car_backend.service.smtp.EmailService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j

public class AppointmentServiceImpl implements AppointmentService {

	private final VehicleRepository vehicleRepo;
	private final AppointmentRepository appointmentRepo;
	private final UserRepository userRepo;
	private final EmailService emailService;
	private final ImageService imageService;

	@Override
	public AppointmentResponseDto createAppointment(CreateAppointmentDto dto,
			org.springframework.web.multipart.MultipartFile image) {
		log.info("creating {} appointment for vehicleId: {}", Boolean.TRUE.equals(dto.isRsa()) ? "RSA" : "Regular",
				dto.getVehicleId());

		Vehicle vehicle = vehicleRepo.findByIdAndIsActiveTrue(dto.getVehicleId())
				.orElseThrow(() -> new ResourceNotFoundException("Vehicle not found."));

		if (!Boolean.TRUE.equals(dto.isRsa()) && dto.getRequestDate().isBefore(LocalDate.now())) {
			throw new InvalidDateException("Appointment date cannot be in the past");
		}

		if (Boolean.TRUE.equals(dto.isRsa())) {
			validateRsaCoordinates(dto.getRsaCoordinates());
		}

		Appointment appointment = new Appointment();
		appointment.setVehicleDetails(vehicle);
		appointment.setRequestDate(dto.getRequestDate());
		appointment.setProblemDescription(dto.getDescription());
		appointment.setCustomerPhotoUrl(dto.getCustomerPhotoUrl());
		appointment.setRsa(Boolean.TRUE.equals(dto.isRsa()));
		appointment.setRsaCoordinates(dto.getRsaCoordinates());
		appointment.setStatus(Status.PENDING);

		// Handle Image Upload
		if (image != null && !image.isEmpty()) {
			try {
				String imageUrl = imageService.uploadImage(image);
				appointment.setVehicleImageUrl(imageUrl);
			} catch (Exception e) {
				log.error("Failed to upload vehicle image to Cloudinary", e);
				// We can choose to fail the request or continue without image.
				// For now, let's continue but log error.
			}
		}

		Appointment saved = appointmentRepo.save(appointment);

		emailService.sendAppointMentEmail(vehicle, appointment);

		log.info("Appointment created successfully with id: {}", saved.getId());

		if (saved.isRsa()) {
			log.warn("RSA alert : Emergency appointment created at coordinates : {}", saved.getRsaCoordinates());
		}

		return mapToResponseDto(saved);
	}

	@Override
	public AppointmentResponseDto updateAppointment(Long appointmentId, UpdateAppointmentDto dto) {

		Appointment appointment = appointmentRepo.findById(appointmentId)
				.orElseThrow(() -> new ResourceNotFoundException("appointment not found"));

		if (appointment.isRsa()) {
			throw new InvalidOperationException(
					"RSA appointments cannot be modified. Please contact support.");
		}

		if (appointment.getStatus() != Status.PENDING) {
			throw new InvalidOperationException(
					"Cannot update appointment with status: " + appointment.getStatus());
		}

		if (dto.getRequestDate() != null) {
			if (dto.getRequestDate().isBefore(LocalDate.now())) {
				throw new InvalidDateException("Appointment date cannot be in the past");
			}
			appointment.setRequestDate(dto.getRequestDate());
		}

		if (dto.getDescription() != null) {
			appointment.setProblemDescription(dto.getDescription());
		}

		if (dto.getCustomerPhotoUrl() != null) {
			appointment.setCustomerPhotoUrl(dto.getCustomerPhotoUrl());
		}

		Appointment updated = appointmentRepo.save(appointment);

		return mapToResponseDto(updated);
	}

	@Override
	public void cancelAppointment(Long appointmentId) {
		Appointment appointment = appointmentRepo.findById(appointmentId)
				.orElseThrow(() -> new ResourceNotFoundException("appointment not found"));
		if (appointment.getStatus() != Status.PENDING) {
			throw new InvalidOperationException("cannot cancel appointment with status: " + appointment.getStatus());
		}

		appointment.setStatus(Status.CANCELLED);
		appointmentRepo.save(appointment);
		emailService.sendCancelAppointmentEmail(appointment);

		log.info("appointment {} cancelled by customer.", appointmentId);
	}

	@Override
	public List<AppointmentResponseDto> getAppointmentsByCustomerId(Long customerId) {
		List<Appointment> appointments = appointmentRepo.findByVehicleDetails_Customer_Id(customerId);

		return appointments.stream().map(this::mapToResponseDto).collect(Collectors.toList());
	}

	@Override
	public List<AppointmentResponseDto> getAppointmentsByVehicleId(Long vehicleId) {
		List<Appointment> appointments = appointmentRepo.findByVehicleDetails_Id(vehicleId);

		return appointments.stream().map(this::mapToResponseDto).collect(Collectors.toList());
	}

	@Override
	public List<AppointmentResponseDto> getAllAppointments() {
		List<Appointment> appointments = appointmentRepo.findAll();
		return appointments.stream().map(this::mapToResponseDto).collect(Collectors.toList());
	}

	@Override
	public AppointmentResponseDto getAppointmentById(Long appointmentId) {
		Appointment appointment = appointmentRepo.findById(appointmentId)
				.orElseThrow(() -> new ResourceNotFoundException("appointment not found"));

		return mapToResponseDto(appointment);
	}

	@Override
	public List<AppointmentResponseDto> findPendingAppointments() {
		List<Appointment> pendingAppointments = appointmentRepo.findByStatus(Status.PENDING);

		return pendingAppointments.stream().map(this::mapToResponseDto).collect(Collectors.toList());
	}

	@Override
	public List<AppointmentResponseDto> getAppointmentsByStatus(Status status) {
		List<Appointment> appointments = appointmentRepo.findByStatus(status);

		return appointments.stream().map(this::mapToResponseDto).collect(Collectors.toList());
	}

	@Override
	public AppointmentResponseDto approveAppointment(Long appointmentId) {
		Appointment appointment = appointmentRepo.findById(appointmentId)
				.orElseThrow(() -> new ResourceNotFoundException("appointment not found"));

		if (appointment.getStatus() != Status.PENDING) {
			throw new InvalidOperationException("Only pending appointments can be approved.");
		}

		appointment.setStatus(Status.APPROVED);
		Appointment approved = appointmentRepo.save(appointment);
		emailService.sendAppointMentApprovedMail(appointment);

		log.info("Appointment {} approved by manager", appointmentId);
		return mapToResponseDto(approved);
	}

	@Override
	public AppointmentResponseDto rejectAppointment(Long appointmentId, String rejectionReason) {
		Appointment appointment = appointmentRepo.findById(appointmentId)
				.orElseThrow(() -> new ResourceNotFoundException("appointment not found"));

		if (appointment.getStatus() != Status.PENDING) {
			throw new InvalidOperationException("only pending appointments can be rejected");
		}

		if (rejectionReason == null || rejectionReason.trim().isEmpty()) {
			throw new IllegalArgumentException("Rejection reason is required.");
		}

		appointment.setStatus(Status.REJECTED);
		appointment.setRejectionReason(rejectionReason);

		Appointment rejected = appointmentRepo.save(appointment);
		log.info("Appointment {} rejected by manager. Reason {} ", appointmentId, rejectionReason);
		return mapToResponseDto(rejected);
	}

	@Override
	public Long getPendingAppointmentCount() {

		return appointmentRepo.countPendingAppointments();
	}

	@Override
	public List<AppointmentResponseDto> getRsaAppointments() {
		List<Appointment> rsaAppointments = appointmentRepo.findByRsaTrue();

		log.info("Rsa Appointments {}", rsaAppointments.getFirst());

		return rsaAppointments.stream().map(this::mapToResponseDto).collect(Collectors.toList());
	}

	@Override
	public List<AppointmentResponseDto> getPendingRsaAppointments() {
		List<Appointment> appointments = appointmentRepo.findByRsaTrueAndStatus(Status.PENDING);

		return appointments.stream().map(this::mapToResponseDto).collect(Collectors.toList());
	}

	@Override
	public List<AppointmentResponseDto> getRsaAppointmentsByStatus(Status status) {
		List<Appointment> appointments = appointmentRepo.findByRsaTrueAndStatus(status);

		return appointments.stream().map(this::mapToResponseDto).collect(Collectors.toList());
	}

	@Override
	public Long getRsaCount() {
		return appointmentRepo.countRsaAppointment();
	}

	@Override
	public AppointmentResponseDto assignManager(Long appointmentId, Long managerId) {
		Appointment appointment = appointmentRepo.findById(appointmentId)
				.orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));

		User manager = userRepo.findById(managerId)
				.orElseThrow(() -> new ResourceNotFoundException("Manager not found"));

		if (manager.getUserRole() != com.car_backend.entities.Role.MANAGER) {
			throw new InvalidOperationException("User is not a Manager");
		}

		appointment.setManager(manager);
		Appointment saved = appointmentRepo.save(appointment);

		log.info("Manager {} assigned to appointment {}", managerId, appointmentId);
		return mapToResponseDto(saved);
	}

	@Override
	public AppointmentResponseDto assignMechanic(Long appointmentId, Long mechanicId) {
		Appointment appointment = appointmentRepo.findById(appointmentId)
				.orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));

		User mechanic = userRepo.findById(mechanicId)
				.orElseThrow(() -> new ResourceNotFoundException("Mechanic not found"));

		if (mechanic.getUserRole() != com.car_backend.entities.Role.MECHANIC) {
			throw new InvalidOperationException("User is not a Mechanic");
		}

		appointment.setMechanic(mechanic);
		if (appointment.getStatus() == Status.PENDING) {
			appointment.setStatus(Status.APPROVED);
		}
		Appointment saved = appointmentRepo.save(appointment);

		log.info("Mechanic {} assigned to appointment {}", mechanicId, appointmentId);
		return mapToResponseDto(saved);
	}

	@Override
	public List<AppointmentResponseDto> getAppointmentsByMechanicId(Long mechanicId) {
		List<Appointment> appointments = appointmentRepo.findByMechanic_Id(mechanicId);
		return appointments.stream().map(this::mapToResponseDto).collect(Collectors.toList());
	}

	private void validateRsaCoordinates(String coordinates) {
		if (coordinates == null || coordinates.trim().isEmpty()) {
			throw new IllegalArgumentException("RSA coordinates required.");
		}

		RsaLocationDto location = RsaLocationDto.fromCoordinates(coordinates);
		if (location == null) {
			throw new IllegalArgumentException("invalid coordinates format. Excepted: 'latitude, longitude'");
		}

		if (location.getLatitude() < -90 || location.getLatitude() > 90) {
			throw new IllegalArgumentException("latitude must be between -90 and 90.");
		}

		if (location.getLongitude() < -90 || location.getLongitude() > 90) {
			throw new IllegalArgumentException("longitude must be between -90 and 90.");
		}
	}

	@Override
	public List<AppointmentResponseDto> getAppointmentsByManagerId(Long managerId) {
		List<Appointment> appointments = appointmentRepo.findByManager_Id(managerId);
		return appointments.stream().map(this::mapToResponseDto).collect(Collectors.toList());
	}

	private AppointmentResponseDto mapToResponseDto(Appointment appointment) {
		Vehicle vehicle = appointment.getVehicleDetails();
		User customer = vehicle.getCustomer();

		return AppointmentResponseDto.builder()
				.id(appointment.getId())
				.vehicleId(vehicle.getId())
				.licensePlate(vehicle.getLicensePlate())
				.brand(vehicle.getBrand())
				.model(vehicle.getModel())
				.color(vehicle.getColor())
				.customerId(customer.getId())
				.customerName(customer.getUserName())
				.email(customer.getEmail())
				.mobile(customer.getMobile())
				.requestDate(appointment.getRequestDate())
				.problemDescription(appointment.getProblemDescription())
				.customerPhotoUrl(appointment.getCustomerPhotoUrl())
				.vehicleImageUrl(appointment.getVehicleImageUrl())
				.isRsa(appointment.isRsa())
				.rsaCoordinates(appointment.getRsaCoordinates())
				.rsaLocation(RsaLocationDto.fromCoordinates(appointment.getRsaCoordinates()))
				.status(appointment.getStatus())
				.rejectionReason(appointment.getRejectionReason())
				.managerId(appointment.getManager() != null ? appointment.getManager().getId() : null)
				.managerName(appointment.getManager() != null ? appointment.getManager().getUserName() : null)
				.mechanicId(appointment.getMechanic() != null ? appointment.getMechanic().getId() : null)
				.mechanicName(appointment.getMechanic() != null ? appointment.getMechanic().getUserName() : null)
				.createdAt(appointment.getCreatedOn())
				.updatedAt(appointment.getLastUpdated())
				.build();

	}

}
