package com.car_backend.service.smtp;

import com.car_backend.entities.Appointment;
import com.car_backend.entities.Role;
import com.car_backend.entities.Vehicle;

public interface EmailService {
	
	void sendSimpleEmail(String to, String subject, String body);

	void sendWelcomeEmail(String email_to, String userName ,Role role);

	void sendAppointMentEmail(Vehicle vehicle, Appointment appointment);

	void sendCancelAppointmentEmail(Appointment appointment);

	void sendAppointMentApprovedMail(Appointment appointment);
	
}
