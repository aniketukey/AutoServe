package com.car_backend.dto.auth;

import com.car_backend.entities.Role;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AuthResponseDto {
    
    private String token;
    @Builder.Default
    private String tokenType = "Bearer";
    
    // User details
    private Long userId;
    private String name;
    private String email;
    private String phone;
    private Role role;
}