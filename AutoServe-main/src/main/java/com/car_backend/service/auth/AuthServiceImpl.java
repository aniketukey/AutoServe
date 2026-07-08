package com.car_backend.service.auth;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;

import org.springframework.stereotype.Service;

import com.car_backend.dto.CreateUserDto;
import com.car_backend.dto.UserResponseDto;
import com.car_backend.dto.auth.AuthResponseDto;
import com.car_backend.dto.auth.LoginRequestDto;
import com.car_backend.dto.auth.RegisterRequestDto;
import com.car_backend.entities.Role;
import com.car_backend.entities.User;
import com.car_backend.exceptions.DuplicateEmailException;
import com.car_backend.exceptions.InvalidCredentialsException;
import com.car_backend.repository.UserRepository;
import com.car_backend.security.jwt.JwtUtil;
import com.car_backend.service.UserServiceImpl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

	private final UserServiceImpl userServiceImpl;
	private final UserRepository userRepository;
	// private final PasswordEncoder passwordEncoder;
	private final JwtUtil jwtUtil;

	private final AuthenticationManager authenticationManager;

	@Override
	public AuthResponseDto register(RegisterRequestDto request) throws DuplicateEmailException {
		log.info("Registering new user: {}", request.getEmail());

		// Create user

		CreateUserDto user = new CreateUserDto();

		user.setUserName(request.getName());
		user.setEmail(request.getEmail());
		user.setPassword(request.getPassword());
		user.setUserRole(request.getRole() != null ? request.getRole() : Role.CUSTOMER);
		user.setMobile(request.getPhone());
		user.setSalary(request.getSalary());
		user.setManagerId(request.getManagerId());
		user.setActive(true);

		UserResponseDto savedUser = userServiceImpl.createUser(user);

		log.info("User registered successfully: {}", savedUser.getEmail());

		// Generate JWT token
		String token = jwtUtil.generateToken(savedUser.getUserId(), savedUser.getEmail(), savedUser.getUserRole());

		// Return response with token
		return AuthResponseDto.builder().token(token).tokenType("Bearer").userId(savedUser.getUserId())
				.name(savedUser.getUserName()).email(savedUser.getEmail()).phone(savedUser.getMobile())
				.role(savedUser.getUserRole()).build();
	}

	@Override
	public AuthResponseDto login(LoginRequestDto request) {

		Authentication authentication;
		try {
			authentication = authenticationManager
					.authenticate(new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));
		} catch (Exception e) {
			throw new InvalidCredentialsException("Invalid email or password");
		}

		// Email comes from authenticated principal
		String email = authentication.getName();

		// Load full User entity
		User user = userRepository.findByEmail(email)
				.orElseThrow(() -> new InvalidCredentialsException("User not found"));

		String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getUserRole());

		return AuthResponseDto.builder().token(token).tokenType("Bearer").userId(user.getId()).name(user.getUserName())
				.email(user.getEmail()).phone(user.getMobile()).role(user.getUserRole()).build();
	}

}
