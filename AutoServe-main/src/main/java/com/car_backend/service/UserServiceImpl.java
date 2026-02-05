package com.car_backend.service;

import java.util.List;
import java.util.stream.Collectors;

import org.modelmapper.ModelMapper;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.car_backend.dto.CreateUserDto;
import com.car_backend.dto.UpdateUserDto;
import com.car_backend.dto.UserResponseDto;
import com.car_backend.entities.Role;
import com.car_backend.entities.User;
import com.car_backend.exceptions.ResourceAlreadyExists;
import com.car_backend.exceptions.ResourceNotFoundException;
import com.car_backend.repository.UserRepository;
import com.car_backend.service.smtp.EmailService;

import lombok.RequiredArgsConstructor;
import lombok.ToString;

@Service
@Transactional
@RequiredArgsConstructor
@ToString
public class UserServiceImpl implements UserService {
	private final UserRepository userRepo;
	private final ModelMapper mapper;
	private final PasswordEncoder encoder;
	private final EmailService emailService;

	@Override
	public UserResponseDto createUser(CreateUserDto dto) {
		
		System.out.println("*********************************************************   1111");
		if (userRepo.existsByEmail(dto.getEmail())) {
			throw new ResourceAlreadyExists("user already exists..");
		}

		System.out.println("*********************************************************   2222");
		
		User entity = mapper.map(dto, User.class);
		entity.setPassword(encoder.encode(dto.getPassword()));

		System.out.println("*********************************************************   3333");
		
		if (dto.getUserRole() == Role.MECHANIC && dto.getManagerId() != null) {
			User manager = userRepo.findById(dto.getManagerId())
					.orElseThrow(() -> new ResourceNotFoundException("Manager not found."));
			entity.setManager(manager);
		}

		System.out.println("*********************************************************   4444");
		
		User savedUser = userRepo.save(entity);
		// SMTP
		emailService.sendWelcomeEmail(savedUser.getEmail(), savedUser.getUserName() , savedUser.getUserRole());
		System.out.println("Email must be sent to\n"+ savedUser.getEmail() +" | "+ savedUser.getUserName() +" | "+ savedUser.getUserRole());



		return mapUserToResponseDto(savedUser);

	}

	@Override
	public List<UserResponseDto> getUsers() {
		List<User> users = userRepo.findAll();

		return users.stream().map(this::mapUserToResponseDto).collect(Collectors.toList());
	}

	@Override
	public UserResponseDto getUserById(Long userId) {
		User user = userRepo.findById(userId)
				.orElseThrow(() -> new ResourceNotFoundException("user with specified id not found."));

		return mapUserToResponseDto(user);
	}

	@Override
	public UserResponseDto updateUser(Long targetUserId, UpdateUserDto dto) {
		User user = userRepo.findById(targetUserId)
				.orElseThrow(() -> new ResourceNotFoundException("user with specified id not found."));

		if (dto.getUserName() != null)
			user.setUserName(dto.getUserName());

		if (dto.getMobile() != null)
			user.setMobile(dto.getMobile());

		if (dto.getUserRole() != null)
			user.setUserRole(dto.getUserRole());

		if (dto.getSalary() != null)
			user.setSalary(dto.getSalary());

		if (dto.getIsActive() != null)
			user.setActive(dto.getIsActive());

		if (dto.getManagerId() != null) {
			User newManager = userRepo.findById(dto.getManagerId())
					.orElseThrow(() -> new ResourceNotFoundException("manager with specified id not found."));
			user.setManager(newManager);
		}

		User savedUser = userRepo.save(user);
		return mapUserToResponseDto(savedUser);
	}

	@Override
	public void deleteUser(Long userId) {
		User user = userRepo.findById(userId)
				.orElseThrow(() -> new ResourceNotFoundException("user with specified id not found."));

		user.setActive(false);
		userRepo.save(user);

	}

	@Override
	public List<UserResponseDto> findActiveUsers() {
		List<User> activeUsers = userRepo.findByIsActiveTrue();

		return activeUsers.stream().map(this::mapUserToResponseDto).collect(Collectors.toList());
	}

	@Override
	public List<UserResponseDto> getAllCustomers() {
		List<User> customers = userRepo.findByUserRole(Role.CUSTOMER);
		return customers.stream().map(this::mapUserToResponseDto).collect(Collectors.toList());
	}

	@Override
	public List<UserResponseDto> getAllManagers() {
		List<User> managers = userRepo.findByUserRole(Role.MANAGER);

		return managers.stream().map(this::mapUserToResponseDto).collect(Collectors.toList());
	}

	@Override
	public List<UserResponseDto> getAllMechanics() {
		List<User> mechanics = userRepo.findByUserRole(Role.MECHANIC);
		return mechanics.stream().map(this::mapUserToResponseDto).collect(Collectors.toList());
	}

	@Override
	public UserResponseDto getCustomerById(Long customerId) {
		User user = userRepo.findById(customerId)
				.orElseThrow(() -> new ResourceNotFoundException("User with specified not found."));
		if (user.getUserRole() != Role.CUSTOMER && user.isActive()) {
			throw new ResourceNotFoundException("ID " + customerId + " does not belongs to Customer");
		}
		return mapUserToResponseDto(user);
	}

	@Override
	public UserResponseDto getManager(Long managerId) {
		User user = userRepo.findById(managerId)
				.orElseThrow(() -> new ResourceNotFoundException("User with specified id not found"));

		if (user.getUserRole() != Role.MANAGER && user.isActive()) {
			throw new ResourceNotFoundException("ID " + managerId + " does not belongs to manager.");
		}
		return mapUserToResponseDto(user);
	}

	@Override
	public UserResponseDto getMechanic(Long mechanicId) {
		User user = userRepo.findById(mechanicId)
				.orElseThrow(() -> new ResourceNotFoundException("User with specified id not found."));

		if (user.getUserRole() != Role.MECHANIC && user.isActive()) {
			throw new ResourceNotFoundException("ID " + " does not belong to mechanic.");
		}
		return mapUserToResponseDto(user);
	}

	@Override
	public List<UserResponseDto> getMechanicsUnderManager(Long managerId) {
		List<User> mechanics = userRepo.findByManagerId(managerId);

		return mechanics.stream().map(this::mapUserToResponseDto).collect(Collectors.toList());
	}

	@Override
	public UserResponseDto assignManagerToMechanic(Long mechanicId, Long managerId) {
		User mechanic = userRepo.findById(mechanicId)
				.orElseThrow(() -> new ResourceNotFoundException("user with specified id does not exist"));

		if (mechanic.getUserRole() != Role.MECHANIC) {
			throw new ResourceNotFoundException("ID " + mechanicId + " does not belong to mechanic.");
		}

		if (!mechanic.isActive()) {
			throw new RuntimeException("Cannot assign manager to an inactive/deleted mechanic.");
		}

		User manager = userRepo.findById(managerId)
				.orElseThrow(() -> new ResourceNotFoundException("manager does not exists with this id"));
		if (manager.getUserRole() != Role.MANAGER) {
			throw new ResourceNotFoundException("ID " + managerId + " does not belong to manager.");
		}

		if (!manager.isActive()) {
			throw new RuntimeException("Cannot assign an inactive/deleted manager.");
		}

		mechanic.setManager(manager);
		userRepo.save(mechanic);
		return mapUserToResponseDto(mechanic);
	}

	private UserResponseDto mapUserToResponseDto(User user) {
		UserResponseDto response = mapper.map(user, UserResponseDto.class);
		response.setUserId(user.getId());
		if (user.getManager() != null) {
			response.setManagerId(user.getManager().getId());
			response.setManagerName(user.getManager().getUserName());
		}
		return response;
	}

}
