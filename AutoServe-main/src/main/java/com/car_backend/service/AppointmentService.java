package com.car_backend.service;

import java.util.List;

import com.car_backend.dto.AppointmentResponseDto;
import com.car_backend.dto.CreateAppointmentDto;
import com.car_backend.dto.UpdateAppointmentDto;
import com.car_backend.entities.Status;

public interface AppointmentService {

	AppointmentResponseDto createAppointment(CreateAppointmentDto dto,
			org.springframework.web.multipart.MultipartFile image);

	AppointmentResponseDto updateAppointment(Long appointmentId, UpdateAppointmentDto dto);

	void cancelAppointment(Long appointmentId);

	List<AppointmentResponseDto> getAppointmentsByCustomerId(Long customerId);

	List<AppointmentResponseDto> getAppointmentsByVehicleId(Long vehicleId);

	AppointmentResponseDto approveAppointment(Long appointmentId);

	List<AppointmentResponseDto> getAllAppointments();

	AppointmentResponseDto getAppointmentById(Long appointmentId);

	List<AppointmentResponseDto> findPendingAppointments();

	List<AppointmentResponseDto> getAppointmentsByStatus(Status status);

	AppointmentResponseDto rejectAppointment(Long appointmentId, String rejectionReason);

	Long getPendingAppointmentCount();

	List<AppointmentResponseDto> getRsaAppointments();

	List<AppointmentResponseDto> getPendingRsaAppointments();

	List<AppointmentResponseDto> getRsaAppointmentsByStatus(Status status);

	Long getRsaCount();

	AppointmentResponseDto assignManager(Long appointmentId, Long managerId);

	AppointmentResponseDto assignMechanic(Long appointmentId, Long mechanicId);

	List<AppointmentResponseDto> getAppointmentsByMechanicId(Long mechanicId);

	List<AppointmentResponseDto> getAppointmentsByManagerId(Long managerId);

}
