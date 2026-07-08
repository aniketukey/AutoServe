package com.car_backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.car_backend.entities.Role;
import com.car_backend.entities.User;

public interface UserRepository extends JpaRepository<User, Long> {

	boolean existsByEmail(String email);
	
	List<User> findByIsActiveTrue();

	List<User> findByUserRole(Role role);
	
	
	List<User> findByManagerId(Long managerId);

	Optional<User> findByEmail(String email);

}
