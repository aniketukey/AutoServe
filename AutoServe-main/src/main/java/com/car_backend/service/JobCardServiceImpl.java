package com.car_backend.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.car_backend.dto.jobCard.AddItemToJobCardDto;
import com.car_backend.dto.jobCard.AssignMechanicDto;
import com.car_backend.dto.jobCard.CreateJobCardDto;
import com.car_backend.dto.jobCard.JobCardEvidenceDto;
import com.car_backend.dto.jobCard.JobCardItemDto;
import com.car_backend.dto.jobCard.JobCardResponseDto;
import com.car_backend.entities.Appointment;
import com.car_backend.entities.Inventory;
import com.car_backend.entities.JobCard;
import com.car_backend.entities.JobCardEvidence;
import com.car_backend.entities.JobCardItem;
import com.car_backend.entities.JobCardStatus;
import com.car_backend.entities.Role;
import com.car_backend.entities.Status;
import com.car_backend.entities.User;
import com.car_backend.entities.Vehicle;
import com.car_backend.exceptions.DuplicateJobCreationException;
import com.car_backend.exceptions.InsufficientStockException;
import com.car_backend.exceptions.InvalidOperationException;
import com.car_backend.exceptions.InvalidRoleException;
import com.car_backend.exceptions.JobCardNotFoundException;
import com.car_backend.exceptions.ResourceNotFoundException;
import com.car_backend.exceptions.StockConflictException;
import com.car_backend.exceptions.UnauthorizedException;
import com.car_backend.exceptions.UserNotFoundException;
import com.car_backend.repository.AppointmentRepository;
import com.car_backend.repository.InventoryRepository;
import com.car_backend.repository.JobCardItemRepository;
import com.car_backend.repository.JobCardRepository;
import com.car_backend.repository.UserRepository;

import jakarta.persistence.OptimisticLockException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class JobCardServiceImpl implements JobCardService {

	private final JobCardRepository jobCardRepo;
	private final AppointmentRepository appointmentRepo;
	private final UserRepository userRepo;
	private final InventoryRepository inventoryRepo;
	private final JobCardItemRepository jobCardItemRepo;

	@Override
	public JobCardResponseDto createJobCard(@Valid CreateJobCardDto dto) {
		
		System.out.println("*******************************************  1111");
		Appointment appointment = appointmentRepo.findById(dto.getAppointmentId()).orElseThrow(
				() -> new ResourceNotFoundException("Appointment does not exist with the given appointment"));

		System.out.println("*******************************************  2222");
		if (appointment.getStatus() != Status.APPROVED) {
			throw new InvalidOperationException("Appointment must be approved for creating job card");
		}

		System.out.println("*******************************************  3333");
		if (jobCardRepo.existsByAppointmentId(dto.getAppointmentId())) {
			throw new DuplicateJobCreationException("Job card already exists for the given appointment id.");
		}

		System.out.println("*******************************************  4444");
		User manager = userRepo.findById(dto.getManagerId())
				.orElseThrow(() -> new UserNotFoundException("manager not found"));

		System.out.println("*******************************************  5555");
		if (manager.getUserRole() != Role.MANAGER) {
			throw new InvalidRoleException("User is not a manager");
		}
		System.out.println("*******************************************  6666");
		User mechanic = null;
		if (dto.getMechanicId() != null) {
			mechanic = validateAndGetMechanic(dto.getMechanicId(), dto.getManagerId());
		}

		System.out.println("*******************************************  7777");
		JobCard jobCard = new JobCard();
		jobCard.setAppointment(appointment);
		jobCard.setManager(manager);
		jobCard.setMechanic(mechanic);
		jobCard.setJobCardStatus(JobCardStatus.CREATED);
		jobCard.setEstimatedCompletionDate(dto.getEstimatedCompletionDate());

		JobCard saved = jobCardRepo.save(jobCard);
		System.out.println("*******************************************  8888");
		appointment.setStatus(Status.IN_PROGRESS);
		appointmentRepo.save(appointment);

		log.info("Job card created with id : {} ", saved.getId());

		System.out.println("*******************************************  9999");
		return mapResponseToDto(jobCard);
	}

	@Override
	public JobCardResponseDto getJobCardById(Long jobCardId) {
		JobCard jobCard = jobCardRepo.findById(jobCardId)
				.orElseThrow(() -> new ResourceNotFoundException("Job card not found for specified id."));

		return mapResponseToDto(jobCard);
	}

	@Override
	public JobCardResponseDto getJobCardByAppointmentId(Long appointmentId) {
		Appointment appointment = appointmentRepo.findById(appointmentId)
				.orElseThrow(() -> new ResourceNotFoundException("appointment id not found."));
		JobCard jobCard = jobCardRepo.findByAppointment(appointment);

		return mapResponseToDto(jobCard);
	}

	@Override
	public List<JobCardResponseDto> getAllJobCards() {
		List<JobCard> jobCards = jobCardRepo.findAll();
		return jobCards.stream().map(this::mapResponseToDto).collect(Collectors.toList());
	}

	@Override
	public JobCardResponseDto updateMechanic(Long jobCardId, AssignMechanicDto dto) {

		JobCard jobCard = jobCardRepo.findById(jobCardId)
				.orElseThrow(() -> new ResourceNotFoundException("job card does not exist with given id"));

		if (jobCard.getJobCardStatus() == JobCardStatus.COMPLETED) {
			throw new InvalidOperationException("Cannot reassign completed job cards");
		}

		User manager = jobCard.getManager();

		User mechanic = validateAndGetMechanic(dto.getMechanicId(), manager.getId());

		jobCard.setMechanic(mechanic);

		JobCard updated = jobCardRepo.save(jobCard);

		return mapResponseToDto(updated);
	}

	@Override
	public JobCardResponseDto startWork(Long jobCardId) {
		JobCard jobCard = jobCardRepo.findById(jobCardId)
				.orElseThrow(() -> new ResourceNotFoundException("job card not found"));

		if (jobCard.getJobCardStatus() != JobCardStatus.CREATED) {
			throw new InvalidOperationException(
					"job card is not in CREATED status. Current status: " + jobCard.getJobCardStatus());
		}

		if (jobCard.getMechanic() == null) {
			throw new InvalidOperationException("cannot start work without mechanic.");
		}

		jobCard.setJobCardStatus(JobCardStatus.IN_PROGRESS);
		JobCard updated = jobCardRepo.save(jobCard);
		return mapResponseToDto(updated);
	}

	@Override
	public JobCardResponseDto completeWork(Long jobCardId) {
		JobCard jobCard = jobCardRepo.findById(jobCardId)
				.orElseThrow(() -> new ResourceNotFoundException("Job card not found"));

		if (jobCard.getJobCardStatus() != JobCardStatus.IN_PROGRESS) {
			throw new InvalidOperationException(
					"job card is not in IN_PROGRESS status. Current status: " + jobCard.getJobCardStatus());
		}

		if (jobCard.getItems().isEmpty()) {
			throw new InvalidOperationException("job card cannot be completed without items/parts added");
		}

		jobCard.setJobCardStatus(JobCardStatus.COMPLETED);
		jobCard.setCompletionTime(LocalDateTime.now());

		JobCard updated = jobCardRepo.save(jobCard);

		Appointment appointment = jobCard.getAppointment();
		appointment.setStatus(Status.COMPLETED);
		appointmentRepo.save(appointment);
		return mapResponseToDto(updated);
	}

	@Override
	public JobCardResponseDto cancelJobCard(Long jobCardId, String reason) {
		log.info("Cancelling job card {} with reason {} ", jobCardId, reason);

		JobCard jobCard = jobCardRepo.findById(jobCardId)
				.orElseThrow(() -> new ResourceNotFoundException("job card not found"));

		if (jobCard.getJobCardStatus() == JobCardStatus.COMPLETED) {
			throw new InvalidOperationException("cannot delete COMPLETED job card");
		}

		if (jobCard.getJobCardStatus() == JobCardStatus.CANCELLED) {
			throw new InvalidOperationException("job card already CANCELLED.");
		}

		if (reason == null || reason.trim().isEmpty()) {
			throw new IllegalArgumentException("Cancellation reason is required");
		}

		for (JobCardItem item : jobCard.getItems()) {
			Inventory inventoryItem = item.getInventoryItem();
			inventoryItem.setStockQuantity(inventoryItem.getStockQuantity() + item.getQuantity());
			inventoryRepo.save(inventoryItem);

			log.info("returned {} units of {} to inventory.", item.getQuantity(), inventoryItem.getItemName());
		}

		jobCard.setJobCardStatus(JobCardStatus.CANCELLED);
		jobCard.setCancellationReason(reason);

		JobCard updated = jobCardRepo.save(jobCard);

		Appointment appointment = jobCard.getAppointment();
		appointment.setStatus(Status.CANCELLED);
		appointmentRepo.save(appointment);

		log.info("Job Card {} cancelled. Reason: {} ", jobCardId, reason);

		return mapResponseToDto(updated);
	}

	@Override
	public JobCardResponseDto addItemToJobCard(Long jobCardId, AddItemToJobCardDto dto) {
		JobCard jobCard = jobCardRepo.findById(jobCardId)
				.orElseThrow(() -> new ResourceNotFoundException("job card not found"));

		if (jobCard.getJobCardStatus() == JobCardStatus.CANCELLED
				|| jobCard.getJobCardStatus() == JobCardStatus.COMPLETED) {
			throw new InvalidOperationException("cannot add items to CANCELLED or COMPLETED job cards");
		}

		Inventory inventoryItem = inventoryRepo.findById(dto.getInventoryItemId())
				.orElseThrow(() -> new ResourceNotFoundException("inventory item does not exist"));

		if (inventoryItem.isDeleted()) {
			throw new InvalidOperationException("cannot use deleted inventory items");
		}

		if (inventoryItem.getStockQuantity() < dto.getQuantity()) {
			throw new InsufficientStockException(
					"Insufficient stock for " + inventoryItem.getItemName() + " available quantity is "
							+ inventoryItem.getStockQuantity() + ", requested quantity is " + dto.getQuantity());
		}

		JobCardItem jobCardItem = new JobCardItem();
		jobCardItem.setJobCard(jobCard);
		jobCardItem.setInventoryItem(inventoryItem);
		jobCardItem.setQuantity(dto.getQuantity());
		jobCardItem.setSnapshotItemName(inventoryItem.getItemName());
		jobCardItem.setSnapshotPrice(inventoryItem.getCurrentPrice());
		jobCardItem.setTotalPrice(inventoryItem.getCurrentPrice() * dto.getQuantity());

		jobCard.getItems().add(jobCardItem);

		try {
			inventoryItem.setStockQuantity(inventoryItem.getStockQuantity() - dto.getQuantity());
			inventoryRepo.save(inventoryItem);

			log.info("Deducted {} units of {} from inventory. Remaining: {} ", dto.getQuantity(),
					inventoryItem.getItemName(), inventoryItem.getStockQuantity());
		} catch (OptimisticLockException e) {
			throw new StockConflictException("Stock was modified by another user. Please refresh and try again.");
		}

		JobCard updated = jobCardRepo.save(jobCard);

		log.info("Item added to job card {}. Total items:{} ", jobCardId, updated.getItems().size());

		return mapResponseToDto(updated);
	}

	@Override
	public JobCardResponseDto removeItemsFromJobCard(Long jobCardId, Long itemId) {
		JobCard jobCard = jobCardRepo.findById(jobCardId)
				.orElseThrow(() -> new ResourceNotFoundException("Job card not found."));

		if (jobCard.getJobCardStatus() == JobCardStatus.COMPLETED) {
			throw new InvalidOperationException("Cannot delete items from COMPLETED job card.");
		}

		if (jobCard.getJobCardStatus() == JobCardStatus.CANCELLED) {
			throw new InvalidOperationException("Cannot delete items from CANCELLED job card.");
		}

		JobCardItem itemToRemove = jobCardItemRepo.findByIdAndJobCardId(itemId, jobCardId)
				.orElseThrow(() -> new JobCardNotFoundException("item not found in this job card"));

		Inventory inventoryItem = itemToRemove.getInventoryItem();
		inventoryItem.setStockQuantity(itemToRemove.getQuantity());
		inventoryRepo.save(inventoryItem);

		log.info("Returned {} units of {} to inventory.", itemToRemove.getQuantity(), inventoryItem.getItemName());

		jobCard.getItems().remove(itemToRemove);

		JobCard updated = jobCardRepo.save(jobCard);

		log.info("item removed from job card {}. Remaining items: {}", jobCardId, updated.getItems().size());

		return mapResponseToDto(updated);
	}

	@Override
	public JobCardResponseDto getJobCardItems(Long jobCardId) {
		JobCard jobCard = jobCardRepo.findById(jobCardId)
				.orElseThrow(() -> new ResourceNotFoundException("Job card not found."));

		return mapResponseToDto(jobCard);
	}

	@Override
	public JobCardResponseDto addEvidence(Long jobCardId, JobCardEvidenceDto dto) {
		JobCard jobCard = jobCardRepo.findById(jobCardId)
				.orElseThrow(() -> new ResourceNotFoundException("Job card not found."));

		if (jobCard.getJobCardStatus() != JobCardStatus.IN_PROGRESS) {
			throw new InvalidOperationException("Cannot add evidence to job Card with status: "
					+ jobCard.getJobCardStatus() + ". Can add evidence in job card having status IN_PROGRESS.");
		}

		JobCardEvidence evidence = new JobCardEvidence();
		evidence.setJobCard(jobCard);
		evidence.setPhotoUrl(dto.getPhotoUrl());
		evidence.setDescription(dto.getDescription());
		evidence.setUploadedAt(LocalDateTime.now());

		jobCard.getEvidences().add(evidence);

		JobCard updated = jobCardRepo.save(jobCard);
		log.info("added evidence to job card: {}. Total evidence: {} ", jobCardId, updated.getEvidences().size());

		return mapResponseToDto(updated);
	}

	@Override
	public JobCardResponseDto removeEvidence(Long jobCardId, Long evidenceId) {
		JobCard jobCard = jobCardRepo.findById(jobCardId)
				.orElseThrow(() -> new ResourceNotFoundException("job card not found."));

		if (jobCard.getJobCardStatus() == JobCardStatus.COMPLETED) {
			throw new InvalidOperationException("cannot remove evidence from COMPLETED job cards");
		}

		JobCardEvidence evidenceToRemove = jobCard.getEvidences().stream()
				.filter(evidence -> evidence.getId().equals(evidenceId)).findFirst()
				.orElseThrow(() -> new ResourceNotFoundException("Evidence not found in this job card"));

		jobCard.getEvidences().remove(evidenceToRemove);

		JobCard updated = jobCardRepo.save(jobCard);
		log.info("Removed evidence from job card {}.", jobCardId);

		return mapResponseToDto(updated);
	}

	@Override
	public List<JobCardResponseDto> getJobCardByManager(Long managerId) {
		User manager = userRepo.findById(managerId)
				.orElseThrow(() -> new ResourceNotFoundException("Manager not found."));

		if (manager.getUserRole() != Role.MANAGER) {
			throw new InvalidRoleException("user: " + managerId + " does not have a manager role.");
		}

		List<JobCard> jobCard = jobCardRepo.findByManager(manager);

		return jobCard.stream().map(this::mapResponseToDto).collect(Collectors.toList());
	}

	@Override
	public List<JobCardResponseDto> getJobCardByMechanic(Long mechanicId) {
		User mechanic = userRepo.findById(mechanicId)
				.orElseThrow(() -> new ResourceNotFoundException("mechanic not found"));

		if (mechanic.getUserRole() != Role.MECHANIC) {
			throw new InvalidRoleException("user " + mechanicId + " is not a mechanic.");
		}

		List<JobCard> jobCard = jobCardRepo.findByMechanic(mechanic);

		return jobCard.stream().map(this::mapResponseToDto).collect(Collectors.toList());
	}

	@Override
	public List<JobCardResponseDto> getJobCardByStatus(JobCardStatus status) {
		List<JobCard> jobCard = jobCardRepo.findByJobCardStatus(status);

		return jobCard.stream().map(this::mapResponseToDto).collect(Collectors.toList());
	}

	@Override
	public List<JobCardResponseDto> getManagerJobCardsByStatus(Long managerId, JobCardStatus status) {
		User manager = userRepo.findById(managerId)
				.orElseThrow(() -> new ResourceNotFoundException("Manager not found."));

		if (manager.getUserRole() != Role.MANAGER) {
			throw new InvalidRoleException("user: " + managerId + " does not have a manager role.");
		}

		List<JobCard> jobCards = jobCardRepo.findByManagerIdAndJobCardStatus(managerId, status);

		return jobCards.stream().map(this::mapResponseToDto).collect(Collectors.toList());
	}

	@Override
	public List<JobCardResponseDto> getMechanicJobCardsByStatus(Long mechanicId, JobCardStatus status) {
		User mechanic = userRepo.findById(mechanicId)
				.orElseThrow(() -> new ResourceNotFoundException("mechanic not found."));

		if (mechanic.getUserRole() != Role.MECHANIC) {
			throw new InvalidRoleException("User: " + mechanicId + " does not have a role mechanic.");
		}

		List<JobCard> jobCards = jobCardRepo.findByMechanicIdAndJobCardStatus(mechanicId, status);
		return jobCards.stream().map(this::mapResponseToDto).collect(Collectors.toList());
	}

	@Override
	public Long getJobCardCount() {
		return jobCardRepo.count();

	}

	@Override
	public Long getInProgressCount() {

		return jobCardRepo.countByJobCardStatus(JobCardStatus.IN_PROGRESS);
	}

	@Override
	public Long getCompletedCount() {

		return jobCardRepo.countByJobCardStatus(JobCardStatus.COMPLETED);
	}

	@Override
	public Long getManagerJobCardCount(Long managerId) {

		return jobCardRepo.countByManagerId(managerId);
	}

	@Override
	public Long getMechanicJobCardCount(Long mechanicId) {

		return jobCardRepo.countByMechanicId(mechanicId);
	}

	@Override
	public Long countManagerJobCardByStatus(Long managerId, JobCardStatus status) {

		return jobCardRepo.countByManagerIdAndJobCardStatus(managerId, status);
	}

	@Override
	public Long countMechanicJobCardByStatus(Long mechanicId, JobCardStatus status) {

		return jobCardRepo.countByMechanicIdAndJobCardStatus(mechanicId, status);
	}

	// ------------------Helper Methods-------------------

	private User validateAndGetMechanic(Long mechanicId, Long managerId) {
		User mechanic = userRepo.findById(mechanicId)
				.orElseThrow(() -> new UserNotFoundException("mechanic not found"));

		if (mechanic.getUserRole() != Role.MECHANIC) {
			throw new InvalidRoleException("user is not a mechanic");
		}

		if (mechanic.getManager() == null || !mechanic.getManager().getId().equals(managerId)) {
			throw new UnauthorizedException(
					"this mechanic does not report to you. Mechanic can only be assigned by manager");
		}
		return mechanic;
	}

	private JobCardResponseDto mapResponseToDto(JobCard jobCard) {
		Appointment appointment = jobCard.getAppointment();
		Vehicle vehicle = appointment.getVehicleDetails();
		User customer = vehicle.getCustomer();
		User manager = jobCard.getManager();
		User mechanic = jobCard.getMechanic();

		List<JobCardItemDto> itemDtos = jobCard.getItems().stream().map(this::mapItemToDto)
				.collect(Collectors.toList());

		List<JobCardEvidenceDto> evidences = jobCard.getEvidences().stream().map(this::mapEvidenceToDto)
				.collect(Collectors.toList());

		Double totalAmount = itemDtos.stream().mapToDouble(JobCardItemDto::getTotalPrice).sum();

		return JobCardResponseDto.builder().id(jobCard.getId())

				.appointmentId(appointment.getId()).problemDescription(appointment.getProblemDescription())
				.appointmentDate(appointment.getRequestDate())

				.vehicleId(vehicle.getId()).licensePlate(vehicle.getLicensePlate()).brand(vehicle.getBrand())
				.model(vehicle.getModel())

				.customerId(customer.getId()).customerName(customer.getUserName()).customerPhone(customer.getMobile())

				.managerId(manager.getId()).managerName(manager.getUserName())

				.mechanicId(mechanic != null ? mechanic.getId() : null)
				.mechanicName(mechanic != null ? mechanic.getUserName() : "Unassigned")

				.status(jobCard.getJobCardStatus()).cancellationReason(jobCard.getCancellationReason())
				.estimatedCompletionDate(jobCard.getEstimatedCompletionDate())
				.completionTime(jobCard.getCompletionTime()).createdAt(jobCard.getCreatedOn())
				.updatedAt(jobCard.getLastUpdated())

				.items(itemDtos).evidence(evidences).totalAmount(totalAmount)

				.build();

	}

	private JobCardItemDto mapItemToDto(JobCardItem jobCardItem) {
		return JobCardItemDto.builder().id(jobCardItem.getId()).itemName(jobCardItem.getSnapshotItemName())
				.itemPrice(jobCardItem.getSnapshotPrice()).quantity(jobCardItem.getQuantity())
				.totalPrice(jobCardItem.getSnapshotPrice() * jobCardItem.getQuantity()).build();
	}

	private JobCardEvidenceDto mapEvidenceToDto(JobCardEvidence evidence) {
		return JobCardEvidenceDto.builder().id(evidence.getId()).photoUrl(evidence.getPhotoUrl())
				.description(evidence.getDescription()).uploadedAt(evidence.getUploadedAt()).build();
	}

}
