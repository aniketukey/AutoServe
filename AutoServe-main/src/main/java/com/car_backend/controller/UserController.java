package com.car_backend.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.car_backend.dto.CreateUserDto;
import com.car_backend.dto.UpdateUserDto;
import com.car_backend.dto.UserResponseDto;
import com.car_backend.service.UserService;

import jakarta.validation.Valid;
import lombok.AllArgsConstructor;

@RestController
@RequestMapping("/api/users")
@AllArgsConstructor

public class UserController {
	private final UserService userService;

	@PreAuthorize("hasRole('ADMIN')")
	@PostMapping
	public ResponseEntity<?> createUser(@RequestBody @Valid CreateUserDto dto) {
		UserResponseDto created = userService.createUser(dto);
		System.out.println(dto);

		return ResponseEntity.status(HttpStatus.CREATED).body(created);
	}

	@PreAuthorize("hasRole('ADMIN')")
	@GetMapping("/getUsers")
	public ResponseEntity<?> getUsers() {
		System.out.println("in user controller get users");

		return ResponseEntity.ok(userService.getUsers());

	}

	@PreAuthorize("hasAnyRole('MANAGER','MECHANIC','ADMIN','CUSTOMER')")
	@GetMapping("/getUserById/{userId}")
	public ResponseEntity<?> findById(@PathVariable Long userId) {
		return ResponseEntity.ok(userService.getUserById(userId));
	}

	@PutMapping("/{userId}")
	public ResponseEntity<?> updateUser(@PathVariable Long userId, @RequestBody UpdateUserDto dto) {
		return ResponseEntity.ok(userService.updateUser(userId, dto));
	}

	@PreAuthorize("hasRole('ADMIN')")
	@DeleteMapping("/{userId}")
	public ResponseEntity<?> deleteUser(@PathVariable Long userId) {
		userService.deleteUser(userId);
		return ResponseEntity.ok().body("User deactivated successfully");
	}

	@PreAuthorize("hasRole('ADMIN')")
	@GetMapping("/active")
	public ResponseEntity<?> getActiveUsers() {
		return ResponseEntity.ok(userService.findActiveUsers());
	}

	@PreAuthorize("hasRole('ADMIN')")
	@GetMapping("/customers")
	public ResponseEntity<?> getCustomers() {
		return ResponseEntity.ok(userService.getAllCustomers());
	}

	@PreAuthorize("hasAnyRole('MANAGER','MECHANIC','ADMIN','CUSTOMER')")
	@GetMapping("/customer/{customerId}")
	public ResponseEntity<?> getCustomer(@PathVariable Long customerId) {
		return ResponseEntity.ok(userService.getCustomerById(customerId));
	}

	@PreAuthorize("hasRole('ADMIN')")
	@GetMapping("/managers")
	public ResponseEntity<?> getManagers() {
		return ResponseEntity.ok(userService.getAllManagers());
	}

	@PreAuthorize("hasAnyRole('MANAGER','MECHANIC','ADMIN','CUSTOMER')")
	@GetMapping("/manager/{managerId}")
	public ResponseEntity<?> getManager(@PathVariable Long managerId) {
		return ResponseEntity.ok(userService.getManager(managerId));
	}

	@PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
	@GetMapping("/managers/{managerId}/mechanics")
	public ResponseEntity<?> getMechanicsUnderManager(@PathVariable Long managerId) {
		return ResponseEntity.ok(userService.getMechanicsUnderManager(managerId));
	}

	@PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
	@GetMapping("/mechanics")
	public ResponseEntity<?> getMechanics() {
		return ResponseEntity.ok(userService.getAllMechanics());
	}

	@PreAuthorize("hasAnyRole('MANAGER','MECHANIC','ADMIN','CUSTOMER')")
	@GetMapping("/mechanic/{mechanicId}")
	public ResponseEntity<?> getMechanic(@PathVariable Long mechanicId) {
		return ResponseEntity.ok(userService.getMechanic(mechanicId));
	}

	@PreAuthorize("hasRole('ADMIN')")
	@PutMapping("/mechanics/{mechanicId}/assign_manager/{managerId}")
	public ResponseEntity<?> assignManager(@PathVariable Long mechanicId, @PathVariable Long managerId) {
		return ResponseEntity.ok(userService.assignManagerToMechanic(mechanicId, managerId));
	}

}
