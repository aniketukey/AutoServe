package com.car_backend.security.service;

import java.util.Collection;
import java.util.Collections;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.car_backend.entities.User;
import com.car_backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;


@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

	private final UserRepository userRepository;

	@Override
	public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {

		User user = userRepository.findByEmail(email)
				.orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));

		return buildUserDetails(user);
	}

	/**
	 * Load user by ID (used by JWT filter)
	 */
	public UserDetails loadUserById(Long id) {

		User user = userRepository.findById(id)
				.orElseThrow(() -> new UsernameNotFoundException("User not found: " + id));

		return buildUserDetails(user);
	}

	/**
	 * Build Spring Security UserDetails from our User entity
	 */
	private UserDetails buildUserDetails(User user) {
		var authorities = getAuthorities(user.getUserRole().toString());
	    System.out.println(">>> Authenticating User: " + user.getEmail());
	    System.out.println(">>> Granted Authorities: " + authorities);

		return org.springframework.security.core.userdetails.User.builder().username(user.getEmail())
				.password(user.getPassword()).authorities(authorities).accountExpired(false)
				.accountLocked(false).credentialsExpired(false).disabled(false).build();
//		.accountLocked(!user.isActive()).credentialsExpired(false).disabled(!user.isActive()).build();
	}

	/**
	 * Convert role string to Spring Security authorities
	 */
	private Collection<? extends GrantedAuthority> getAuthorities(String role) {
		return Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role));
	}

}
