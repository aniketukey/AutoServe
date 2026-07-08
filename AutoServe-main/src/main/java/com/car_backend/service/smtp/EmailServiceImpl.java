package com.car_backend.service.smtp;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import com.car_backend.entities.Appointment;
import com.car_backend.entities.Role;
import com.car_backend.entities.Vehicle;

import jakarta.mail.internet.MimeMessage;

@Service
public class EmailServiceImpl implements EmailService {

	 @Autowired
	    private JavaMailSender mailSender;

	 	@Value("${app.mail.from}")
	    private String from;

	    @Async
	    @Override
	    public void sendSimpleEmail(String to, String subject, String body) {
	        SimpleMailMessage message = new SimpleMailMessage();
	        message.setFrom(from);
	        message.setTo(to);
	        message.setSubject(subject);
	        message.setText(body);
	        mailSender.send(message);
	    }

//		@Override
//		public void sendWelcomeEmail(String email_to, String userName , Role role) {
//			String subject = "Welcome to Car Maintenance Tracker!";
//	        String body = "Hello " + userName + ",\n\n"
//	                    + "Welcome to Car Maintenance Tracker. We're happy to have you!\n\n"
//	                    + "Role :"+ role +" \n\n"
//	                    + "Regards,\nCar Maintenance Tracker Team";
//	        SimpleMailMessage message = new SimpleMailMessage();
//	        message.setFrom(from);
//	        message.setTo(email_to);
//	        message.setSubject(subject);
//	        message.setText(body);
//	        mailSender.send(message);
//		}
	    
		@Override
		public void sendWelcomeEmail(String emailTo, String userName, Role role) {

			try {
				String subject = "Welcome to Auto Serve!";

				String htmlBody = """
						    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
						        <h2 style="color:#2c3e50;">Auto Serve</h2>

								<p>Registration Successful... </p>
						        <p>Hello <b>%s</b>,</p>

						        <p>Welcome to <b>Auto Serve</b>. We're happy to have you!</p>
						        <p><b>Role:</b> %s</p>

						        <br>
						        <p>Regards,<br>
						        <b>Auto Serve Team</b></p>

						        <hr>
						        <small style="color:gray;">This is an automated email. Please do not reply.</small>
						    </div>
						""".formatted(userName, role);

				MimeMessage message = mailSender.createMimeMessage();
				MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

				helper.setFrom(from);
				helper.setTo(emailTo);
				helper.setSubject(subject);
				helper.setText(htmlBody, true); // true = HTML

				mailSender.send(message);

			} catch (Exception e) {
				e.printStackTrace();
			}
		}

		@Override
		public void sendAppointMentEmail(Vehicle vehicle, Appointment appointment) {
			try {
				String subject = "Auto Serve -Appointment Created – Awaiting Confirmation";

				String htmlBody = """
						    <div style="font-family: Arial, sans-serif; background-color:#f9f9f9; padding:20px;">
						      <div style="max-width:600px; margin:auto; background:white; padding:20px; border-radius:8px; box-shadow:0 0 10px rgba(0,0,0,0.05);">

						          <h2 style="color:#2c3e50;">Auto Serve</h2>
						          <hr>

						          <p>Hello <b>%s</b>,</p>

						          <p>We have received your appointment request. Your appointment is currently <b style="color:#e67e22;">%s</b>.</p>

						          <p>Here are the details you submitted:</p>

						          <table style="width:100%%; border-collapse: collapse;">
						              <tr>
						                  <td style="padding:8px;"><b>Problem Description</b></td>
						                  <td style="padding:8px;">%s</td>
						              </tr>
						              <tr>
						                  <td style="padding:8px;"><b>Requested Date</b></td>
						                  <td style="padding:8px;">%s</td>
						              </tr>
						          </table>

						          <br>
						          <p>Our team will review your request and notify you once the appointment is confirmed.</p>

						          <p>Regards,<br>
						          <b>Auto Serve Team</b></p>

						          <hr>
						          <small style="color:gray;">This is an automated email. Please do not reply.</small>
						      </div>
						  </div>
						""".formatted(vehicle.getCustomer().getUserName()
									, appointment.getStatus()
									, appointment.getProblemDescription()
									, appointment.getRequestDate()
									);

				MimeMessage message = mailSender.createMimeMessage();
				MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

				helper.setFrom(from);
				helper.setTo(vehicle.getCustomer().getEmail());
				helper.setSubject(subject);
				helper.setText(htmlBody, true); // true = HTML

				mailSender.send(message);

			} catch (Exception e) {
				e.printStackTrace();
			}
			
		}

		@Override
		public void sendCancelAppointmentEmail(Appointment appointment) {
			try {
				String subject = "Auto Serve -Appointment Cancellation Approved";

				String htmlBody = """
						    <div style="font-family: Arial, sans-serif; background-color:#f9f9f9; padding:20px;">
						      <div style="max-width:600px; margin:auto; background:white; padding:20px; border-radius:8px; box-shadow:0 0 10px rgba(0,0,0,0.05);">
									
								<div style="position: absolute; top: 15px; right: 15px;
						              width: fit-content;
						              background: rgba(0,0,0,0.75); color: white;
						              padding: 6px 12px; border-radius: 6px;
						              font-family: system-ui, -apple-system, sans-serif;
						              font-size: 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.35);">
						      Appointment Id: %s
						  </div>
						          <h2 style="color:#2c3e50;">Auto Serve</h2>
						          <hr>

						          <p>Hello <b>%s</b>,</p>
						          <p>Your request to cancel the appointment has been accepted.</p>

						          <table style="width:100%%; border-collapse: collapse;">
						              <tr>
						                  <td style="padding:8px;"><b>Problem Description</b></td>
						                  <td style="padding:8px;">%s</td>
						              </tr>
						              <tr>
						                  <td style="padding:8px;"><b>Requested Date</b></td>
						                  <td style="padding:8px;">%s</td>
						              </tr>
						          </table>

						          <br>
						           <p>This appointment is now officially cancelled.</p>

						           <p>If you would like to book a new appointment, you can do so anytime.</p>

						          <p>Regards,<br>
						          <b>Auto Serve Team</b></p>

						          <hr>
						          <small style="color:gray;">This is an automated email. Please do not reply.</small>
						      </div>
						  </div>
						"""
						.formatted( 
									appointment.getId(),
									appointment.getVehicleDetails().getCustomer().getUserName(),
									appointment.getProblemDescription(),
									appointment.getRequestDate());

				MimeMessage message = mailSender.createMimeMessage();
				MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

				helper.setFrom(from);
				helper.setTo(appointment.getVehicleDetails().getCustomer().getEmail());
				helper.setSubject(subject);
				helper.setText(htmlBody, true); // true = HTML

				mailSender.send(message);

			} catch (Exception e) {
				e.printStackTrace();
			}

		}

		@Override
		public void sendAppointMentApprovedMail(Appointment appointment) {
			try {
				String subject = "Auto Serve -Appointment Approved";

				String htmlBody = """
						    <div style="font-family: Arial, sans-serif; background-color:#f9f9f9; padding:20px;">
						      <div style="max-width:600px; margin:auto; background:white; padding:20px; border-radius:8px; box-shadow:0 0 10px rgba(0,0,0,0.05);">
									
								<div style="position: absolute; top: 15px; right: 15px;
						              width: fit-content;
						              background: rgba(0,0,0,0.75); color: white;
						              padding: 6px 12px; border-radius: 6px;
						              font-family: system-ui, -apple-system, sans-serif;
						              font-size: 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.35);">
						      			Appointment Id: %s
						  		</div>
						          <h2 style="color:#2c3e50;">Auto Serve</h2>
						          <hr>

						          <p>Hello <b>%s</b>,</p>
						           <p>Your appointment request has been 
							       <b style="color:#27ae60;">approved</b>.</p>
							
							    <p>Here are the confirmed appointment details:</p>

						          <table style="width:100%%; border-collapse: collapse;">
						              <tr>
						                  <td style="padding:8px;"><b>Problem Description</b></td>
						                  <td style="padding:8px;">%s</td>
						              </tr>
						              <tr>
						                  <td style="padding:8px;"><b>Requested Date</b></td>
						                  <td style="padding:8px;">%s</td>
						              </tr>
						          </table>

						         <br>

								    <p>Please ensure your vehicle is available at the scheduled time.</p>
								
								    <p>If you need to make changes to this appointment, you can manage it anytime from the application.</p>
								
								    <p>Regards,<br>
								      <b>Auto Serve Team</b>
								    </p>

						          <hr>
						          <small style="color:gray;">This is an automated email. Please do not reply.</small>
						      </div>
						  </div>
						"""
						.formatted( 
									appointment.getId(),
									appointment.getVehicleDetails().getCustomer().getUserName(),
									appointment.getProblemDescription(),
									appointment.getRequestDate());

				MimeMessage message = mailSender.createMimeMessage();
				MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

				helper.setFrom(from);
				helper.setTo(appointment.getVehicleDetails().getCustomer().getEmail());
				helper.setSubject(subject);
				helper.setText(htmlBody, true); // true = HTML

				mailSender.send(message);

			} catch (Exception e) {
				e.printStackTrace();
			}
			
		}

}
