package com.car_backend.dto.auth;

import com.car_backend.entities.Role;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequestDto {

	@NotBlank(message = "Name is required")
    @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
    private String name;
    
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;
    
    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;
    
    // Role is optional - defaults to CUSTOMER
    @NotNull(message="Role cannot be blank.")
    private Role role;

    @NotBlank(message = "Phone is required")
    @Pattern(regexp = "^[0-9]{10}$", message = "Phone must be 10 digits")
    private String phone;
    
    
	
    
    
//	private Role userRole;
	
//	@Pattern(regexp = "^\\d{10}$", message = "Invalid phone number format")
//	private String mobile;
//	
	
	@Min(value=1, message="salary must be greater than 1")
	private Double salary;

	private Long managerId;
	
	private boolean isActive = true;
	
    
    
}

//
//{
//	  "name": "string",
//	  "email": "user@example.com",
//	  "phone": "7101569700",
//	  "password": "string",
//	  "role": "ADMIN"
//	}
//	{
//	  "userName": "string",
//	  "email": "user@example.com",
//	  "password": "u8>0bS['",
//	  "userRole": "ADMIN",
//	  "mobile": "4269261845",
//	  "salary": 0.1,
//	  "managerId": 0,
//	  "active": true
//	}