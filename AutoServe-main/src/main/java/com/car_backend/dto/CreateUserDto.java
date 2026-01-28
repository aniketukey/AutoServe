package com.car_backend.dto;

import com.car_backend.entities.Role;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter

public class CreateUserDto {
	
	@NotBlank(message="Name cannot be blank")
	@Size(min=5, max=20, message="Name must be between 5 and 20")
	private String userName;
	
	@NotBlank
	@Email
	private String email;
	
	@Pattern(regexp = "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?]).{8,20}$",
            message = "Password must contain at least one digit, one lowercase letter, one uppercase letter, and one special character.")
	private String password;
	
	@NotNull(message="Role cannot be blank.")
	private Role userRole;
	
	@Pattern(regexp = "^\\d{10}$", message = "Invalid phone number format")
	private String mobile;
	
	
	@Min(value=1, message="salary must be greater than 1")
	private Double salary;
	
	private boolean isActive = true;
	
	private Long managerId;
	
	
}
