package com.car_backend.service.auth;

import com.car_backend.dto.auth.AuthResponseDto;
import com.car_backend.dto.auth.LoginRequestDto;
import com.car_backend.dto.auth.RegisterRequestDto;
import com.car_backend.exceptions.DuplicateEmailException;
import com.car_backend.exceptions.InvalidCredentialsException;

public interface AuthService {

    AuthResponseDto register(RegisterRequestDto request) throws DuplicateEmailException;
    
    AuthResponseDto login(LoginRequestDto request) throws InvalidCredentialsException;
}