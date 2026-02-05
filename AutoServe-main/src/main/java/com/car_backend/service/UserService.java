package com.car_backend.service;

import java.util.List;

import com.car_backend.dto.CreateUserDto;
import com.car_backend.dto.UpdateUserDto;
import com.car_backend.dto.UserResponseDto;

public interface UserService {

	UserResponseDto createUser(CreateUserDto dto);

	List<UserResponseDto> getUsers();

	UserResponseDto getUserById(Long userId);

	UserResponseDto updateUser(Long targetUserId, UpdateUserDto dto);

	void deleteUser(Long userId);

	List<UserResponseDto> findActiveUsers();

	List<UserResponseDto> getAllCustomers();

	List<UserResponseDto> getAllManagers();
	
	List<UserResponseDto> getAllMechanics();

	UserResponseDto getCustomerById(Long customerId);

	UserResponseDto getManager(Long managerId);

	UserResponseDto getMechanic(Long mechanicId);

	List<UserResponseDto> getMechanicsUnderManager(Long managerId);

	UserResponseDto assignManagerToMechanic(Long mechanicId, Long managerId);
	
	
	
}
