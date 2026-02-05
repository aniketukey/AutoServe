package com.car_backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.car_backend.entities.Appointment;
import com.car_backend.entities.JobCard;
import com.car_backend.entities.JobCardStatus;
import com.car_backend.entities.User;

public interface JobCardRepository extends JpaRepository<JobCard, Long> {

	boolean existsByAppointmentId(Long appointmentId);

	JobCard findByAppointment(Appointment appointment);

	List<JobCard> findByManager(User manager);

	List<JobCard> findByMechanic(User mechanic);

	List<JobCard> findByJobCardStatus(JobCardStatus jobCardStatus);

	List<JobCard> findByManagerIdAndJobCardStatus(Long managerId, JobCardStatus status);

	List<JobCard> findByMechanicIdAndJobCardStatus(Long mechanicId, JobCardStatus status);

	long countByMechanicIdAndJobCardStatus(Long mechanicId, JobCardStatus status);

	long countByManagerIdAndJobCardStatus(Long managerId, JobCardStatus status);

	Long countByJobCardStatus(JobCardStatus status);

	Long countByManagerId(Long managerId);

	Long countByMechanicId(Long mechanicId);

	@org.springframework.data.jpa.repository.Query("SELECT SUM(i.snapshotPrice * i.quantity) FROM JobCard j JOIN j.items i WHERE j.manager.id = :managerId AND j.jobCardStatus = 'COMPLETED'")
	Double calculateRevenueByManagerId(Long managerId);

	@org.springframework.data.jpa.repository.Query("SELECT j FROM JobCard j JOIN j.appointment a JOIN a.vehicleDetails v JOIN v.customer c "
			+
			"WHERE (v.licensePlate LIKE %:keyword% OR c.userName LIKE %:keyword%) AND j.manager.id = :managerId")
	List<JobCard> searchHistory(String keyword, Long managerId);

	@org.springframework.data.jpa.repository.Query("SELECT SUM(i.snapshotPrice * i.quantity) FROM JobCard j JOIN j.items i WHERE j.jobCardStatus = 'COMPLETED'")
	Double calculateTotalRevenue();

	@org.springframework.data.jpa.repository.Query("SELECT j FROM JobCard j WHERE j.appointment.vehicleDetails.customer.id = :customerId")
	List<JobCard> findByCustomerId(Long customerId);

}

// long countByStatus(JobCardStatus status);
// long countByManagerId(Long managerId);
// long countByMechanicId(Long mechanicId);