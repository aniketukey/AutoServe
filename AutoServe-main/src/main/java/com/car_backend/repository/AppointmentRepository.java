package com.car_backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.car_backend.entities.Appointment;
import com.car_backend.entities.Status;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
	
	List<Appointment> findByVehicleDetails_Customer_Id(Long customerId);
	
	List<Appointment> findByVehicleDetails_Id(Long vehicleId);
	
	List<Appointment> findByStatus(Status status);
	
	@Query("SELECT COUNT(*) FROM Appointment WHERE status='PENDING'")
	Long countPendingAppointments();
	
	List<Appointment> findByRsaTrue();
	
	List<Appointment> findByRsaTrueAndStatus(Status status);
	
	@Query("SELECT COUNT(*) FROM Appointment WHERE rsa=true")
	Long countRsaAppointment();
}
