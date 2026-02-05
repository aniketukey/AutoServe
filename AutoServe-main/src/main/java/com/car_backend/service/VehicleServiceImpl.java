package com.car_backend.service;

import java.util.List;
import java.util.stream.Collectors;

import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.car_backend.dto.CreateVehicleDto;
import com.car_backend.dto.VehicleResponseDto;
import com.car_backend.dto.VehicleUpdateDto;
import com.car_backend.entities.Role;
import com.car_backend.entities.User;
import com.car_backend.entities.Vehicle;
import com.car_backend.exceptions.ResourceAlreadyExists;
import com.car_backend.exceptions.ResourceNotFoundException;
import com.car_backend.repository.UserRepository;
import com.car_backend.repository.VehicleRepository;

import lombok.RequiredArgsConstructor;

@Service
@Transactional
@RequiredArgsConstructor
public class VehicleServiceImpl implements VehicleService {

	private final ModelMapper mapper;
	private final VehicleRepository vehicleRepo;
	private final UserRepository userRepo;

	@Override
	public VehicleResponseDto createVehicle(CreateVehicleDto dto) {
		if (vehicleRepo.existsByLicensePlate(dto.getLicensePlate())) {
			throw new ResourceAlreadyExists("Vehicle with the license plate already exists.");
		}

		Vehicle vehicle = mapper.map(dto, Vehicle.class);

		User customer = userRepo.findById(dto.getCustomerId()).orElseThrow(
				() -> new ResourceNotFoundException("Customer does not exists with the given customer id"));

		if (customer.getUserRole() != Role.CUSTOMER) {
			throw new RuntimeException("Error: User with ID: " + dto.getCustomerId()
					+ " is not a customer. Only customer can own a vehicle.");
		}

		vehicle.setCustomer(customer);
		vehicleRepo.save(vehicle);
		return mapVehicleToDto(vehicle);
	}

	@Override
	public List<VehicleResponseDto> getVehicles() {
		List<Vehicle> vehicles = vehicleRepo.findByIsActiveTrue();

		return vehicles.stream().map(this::mapVehicleToDto).collect(Collectors.toList());
	}

	@Override
	public VehicleResponseDto updateVehicle(Long vehicleId, VehicleUpdateDto dto) {
		Vehicle vehicle = vehicleRepo.findById(vehicleId)
				.orElseThrow(() -> new ResourceNotFoundException("Could not found vehicle with specified id"));
		
		if (!vehicle.isActive()) {
            throw new ResourceNotFoundException("Cannot update a deleted vehicle.");
        }

		if (dto.getBrand() != null) {
			vehicle.setBrand(dto.getBrand());
		}

		if (dto.getColor() != null) {
			vehicle.setColor(dto.getColor());
		}

		if (dto.getModel() != null) {
			vehicle.setModel(dto.getModel());
		}

		Vehicle updated = vehicleRepo.save(vehicle);
		return mapVehicleToDto(updated);
	}

	@Override
	public VehicleResponseDto getVehicleById(Long vehicleId) {
		Vehicle vehicle = vehicleRepo.findByIdAndIsActiveTrue(vehicleId)
				.orElseThrow(() -> new ResourceNotFoundException("Vehicle with specified id does not exist."));

		return mapVehicleToDto(vehicle);
	}

	@Override
	public VehicleResponseDto getVehicleByRegistration(String licensePlate) {

		Vehicle vehicle = vehicleRepo.findByLicensePlateAndIsActiveTrue(licensePlate).orElseThrow(
				() -> new ResourceNotFoundException("Vehicle with specified license plate does not exist."));

		return mapVehicleToDto(vehicle);
	}

	@Override
	public List<VehicleResponseDto> getCustomerVehicles(Long customerId) {

		User customer = userRepo.findById(customerId)
				.orElseThrow(() -> new ResourceNotFoundException("user with specified id does not exist."));

		if (customer.getUserRole() != Role.CUSTOMER) {
			throw new RuntimeException("Role of user with id " + customer.getId() + " is not customer.");
		}

		List<Vehicle> vehicles = vehicleRepo.findByCustomerIdAndIsActiveTrue(customerId);
		return vehicles.stream().map(this::mapVehicleToDto).collect(Collectors.toList());
	}

	@Override
	public VehicleResponseDto deleteVehicle(Long vehicleId) {
		Vehicle vehicle = vehicleRepo.findById(vehicleId).orElseThrow(
				() -> new ResourceNotFoundException("Vehicle does not exist for specified id: " + vehicleId));
		
		if (!vehicle.isActive()) {
            throw new ResourceNotFoundException("Vehicle is already deleted.");
        }

		vehicle.setActive(false);
		vehicleRepo.save(vehicle);

		return mapVehicleToDto(vehicle);

	}

	private VehicleResponseDto mapVehicleToDto(Vehicle vehicle) {
		VehicleResponseDto response = mapper.map(vehicle, VehicleResponseDto.class);
		response.setVehicleId(vehicle.getId());

		if (vehicle.getCustomer() != null) {
			response.setCustomerId(vehicle.getCustomer().getId());
			response.setCustomerName(vehicle.getCustomer().getUserName());
			response.setCustomerEmail(vehicle.getCustomer().getEmail());
			response.setCustomerMobile(vehicle.getCustomer().getMobile());
			response.setActive(true);
		}
		return response;
	}

}
