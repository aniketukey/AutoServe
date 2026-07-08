package com.car_backend.controller;

import java.util.List;
import java.util.stream.Collectors;

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

import com.car_backend.dto.jobCard.AddItemToJobCardDto;
import com.car_backend.dto.jobCard.AssignMechanicDto;
import com.car_backend.dto.jobCard.CancelJobCardDto;
import com.car_backend.dto.jobCard.CreateJobCardDto;
import com.car_backend.dto.jobCard.JobCardEvidenceDto;
import com.car_backend.dto.jobCard.JobCardResponseDto;
import com.car_backend.dto.jobCard.ManagerDashboardDto;
import com.car_backend.dto.jobCard.MechanicDashboardDto;
import com.car_backend.dto.jobCard.MechanicWorkloadDto;
import com.car_backend.entities.JobCardStatus;
import com.car_backend.service.JobCardService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/job_cards")
@RequiredArgsConstructor
@Slf4j

public class JobCardController {
	private final JobCardService jobCardService;

	// -----------------------jobcard management-----------------------

	// Only Manager and admin
	@PreAuthorize("hasAnyRole('MANAGER','MECHANIC')")
	@PostMapping
	public ResponseEntity<?> createJobCard(@Valid @RequestBody CreateJobCardDto dto) {
		log.info("in create job card controller");
		return ResponseEntity.ok(jobCardService.createJobCard(dto));
	}

	@PreAuthorize("hasAnyRole('MANAGER','MECHANIC')")
	@GetMapping("/{id}")
	public ResponseEntity<?> getJobCardById(@PathVariable Long id) {
		log.info("in get job card by id controller.");
		return ResponseEntity.ok(jobCardService.getJobCardById(id));

	}

	@PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
	@GetMapping
	public ResponseEntity<?> getAllJobCards() {
		return ResponseEntity.ok(jobCardService.getAllJobCards());
	}

	@PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
	@GetMapping("/appointment/{appointmentId}")
	public ResponseEntity<?> getJobCardByAppointmentId(@PathVariable Long appointmentId) {
		log.info("in get job card by appointmentId");
		return ResponseEntity.ok(jobCardService.getJobCardByAppointmentId(appointmentId));
	}

	// -----------------------Mechanic management-----------------------

	@PreAuthorize("hasAnyRole('MANAGER','MECHANIC')")
	@PutMapping("/{id}/assign_mechanic")
	public ResponseEntity<?> assignMechanic(@PathVariable Long id, @Valid @RequestBody AssignMechanicDto dto) {
		log.info("assigning mechanic {} to job card {}", dto.getMechanicId(), id);
		return ResponseEntity.ok(jobCardService.updateMechanic(id, dto));
	}

	@PreAuthorize("hasRole('MANAGER')")
	@PutMapping("/{id}/reassign_mechanic")
	public ResponseEntity<?> reassignMechanic(@PathVariable Long id, @Valid @RequestBody AssignMechanicDto dto) {
		log.info("reassigning mechanic {} to job card {}", dto.getMechanicId(), id);
		return ResponseEntity.ok(jobCardService.updateMechanic(id, dto));
	}

	// -----------------------Status management-----------------------

	@PreAuthorize("hasRole('MECHANIC')")
	@PutMapping("/{id}/start")
	public ResponseEntity<?> startWork(@PathVariable Long id) {
		log.info("started working on jobCard {}", id);
		return ResponseEntity.ok(jobCardService.startWork(id));
	}

	@PreAuthorize("hasRole('MECHANIC')")
	@PutMapping("/{id}/complete")
	public ResponseEntity<?> completeWork(@PathVariable Long id) {
		log.info("completing job card {}", id);
		return ResponseEntity.ok(jobCardService.completeWork(id));
	}

	@PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
	@DeleteMapping("/{id}/cancel")
	public ResponseEntity<?> cancelJobCard(@PathVariable Long id, @Valid @RequestBody CancelJobCardDto dto) {
		return ResponseEntity.ok(jobCardService.cancelJobCard(id, dto.getReason()));
	}

	// -----------------------Items management-----------------------

	@PreAuthorize("hasAnyRole('MANAGER','MECHANIC')")
	@PostMapping("/{id}/items")
	public ResponseEntity<?> addItemToJobCard(@PathVariable Long id, @RequestBody AddItemToJobCardDto dto) {
		return ResponseEntity.ok(jobCardService.addItemToJobCard(id, dto));
	}

	@PreAuthorize("hasAnyRole('MANAGER','MECHANIC')")
	@DeleteMapping("/{jobCardId}/items/{itemId}")
	public ResponseEntity<?> removeItemsFromJobCard(@PathVariable Long jobCardId, @PathVariable Long itemId) {
		return ResponseEntity.ok(jobCardService.removeItemsFromJobCard(jobCardId, itemId));
	}

	@PreAuthorize("hasAnyRole('MANAGER','MECHANIC')")
	@GetMapping("/{id}/items")
	public ResponseEntity<?> getJobCardItems(@PathVariable Long id) {
		return ResponseEntity.ok(jobCardService.getJobCardItems(id));
	}

	// -----------------------Evidence management-----------------------

	@PostMapping("/{id}/evidence")
	public ResponseEntity<?> addEvidence(@PathVariable Long id, @RequestBody JobCardEvidenceDto dto) {
		return ResponseEntity.ok(jobCardService.addEvidence(id, dto));
	}

	@DeleteMapping("/{jobCardId}/evidence/{evidenceId}")
	public ResponseEntity<?> removeEvidence(@PathVariable Long jobCardId, @PathVariable Long evidenceId) {
		return ResponseEntity.ok(jobCardService.removeEvidence(jobCardId, evidenceId));
	}

	@GetMapping("/{id}/evidence")
	public ResponseEntity<?> getJobCardEvidence(@PathVariable Long id) {
		return ResponseEntity.ok(jobCardService.getJobCardById(id));
	}

	// -----------------------Query Endpoints-----------------------

	@PreAuthorize("hasRole('ADMIN')")
	@GetMapping("/manager/{managerId}")
	public ResponseEntity<?> getJobCardsByManager(@PathVariable Long managerId) {
		return ResponseEntity.ok(jobCardService.getJobCardByManager(managerId));
	}

	@PreAuthorize("hasAnyRole('MANAGER','ADMIN','MECHANIC')")
	@GetMapping("/mechanic/{mechanicId}")
	public ResponseEntity<?> getJobCardByMechanic(@PathVariable Long mechanicId) {
		return ResponseEntity.ok(jobCardService.getJobCardByMechanic(mechanicId));
	}

	@PreAuthorize("hasAnyRole('MANAGER','ADMIN','MECHANIC')")
	@GetMapping("/status/{status}")
	public ResponseEntity<?> getJobCardsByStatus(@PathVariable JobCardStatus status) {
		return ResponseEntity.ok(jobCardService.getJobCardByStatus(status));
	}

	@PreAuthorize("hasRole('ADMIN')")
	@GetMapping("/manager/{managerId}/status/{status}")
	public ResponseEntity<?> getManagerJobCardsByStatus(@PathVariable Long managerId,
			@PathVariable JobCardStatus status) {
		return ResponseEntity.ok(jobCardService.getManagerJobCardsByStatus(managerId, status));
	}

	@PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
	@GetMapping("/mechanic/{mechanicId}/status/{status}")
	public ResponseEntity<?> getMechanicJobCardsByStatus(@PathVariable Long mechanicId,
			@PathVariable JobCardStatus status) {
		return ResponseEntity.ok(jobCardService.getMechanicJobCardsByStatus(mechanicId, status));
	}

	// -----------------------Statistics Endpoints--------------------------

	@PreAuthorize("hasRole('ADMIN')")
	@GetMapping("/stats/total_count")
	public ResponseEntity<?> getTotalJobCardCount() {
		return ResponseEntity.ok(jobCardService.getJobCardCount());
	}

	@PreAuthorize("hasRole('ADMIN')")
	@GetMapping("/stats/in_progress")
	public ResponseEntity<?> getInProgressJobCardCount() {
		return ResponseEntity.ok(jobCardService.getInProgressCount());
	}

	@PreAuthorize("hasRole('ADMIN')")
	@GetMapping("/stats/completed_count")
	public ResponseEntity<?> getCompletedCount() {
		return ResponseEntity.ok(jobCardService.getCompletedCount());
	}

	@PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
	@GetMapping("/stats/manager/{managerId}/count")
	public ResponseEntity<?> getManagerJobCardCount(@PathVariable Long managerId) {
		return ResponseEntity.ok(jobCardService.getManagerJobCardCount(managerId));
	}

	@PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
	@GetMapping("/stats/mechanic/{mechanicId}/count")
	public ResponseEntity<?> getMechanicJobCardCount(@PathVariable Long mechanicId) {
		return ResponseEntity.ok(jobCardService.getMechanicJobCardCount(mechanicId));
	}

	// ----------------------------Dashboard Endpoint-----------------------
	@PreAuthorize("hasRole('MANAGER')")
	@GetMapping("/dashboard/manager/{managerId}")
	public ResponseEntity<?> getManagerDashboard(@PathVariable Long managerId) {
		Long totalJobs = jobCardService.getManagerJobCardCount(managerId);
		Long inProgress = (long) jobCardService.getManagerJobCardsByStatus(managerId, JobCardStatus.IN_PROGRESS).size();
		Long completed = jobCardService.countManagerJobCardByStatus(managerId, JobCardStatus.COMPLETED);
		List<JobCardResponseDto> recentJobs = jobCardService.getJobCardByManager(managerId)
				.stream()
				.limit(5)
				.collect(Collectors.toList());

		ManagerDashboardDto dashboard = ManagerDashboardDto.builder()
				.totalJobCards(totalJobs)
				.inProgressJobCards(inProgress)
				.completedJobCards(completed)
				.recentJobCards(recentJobs)
				.build();

		return ResponseEntity.ok(dashboard);
	}

	@PreAuthorize("hasRole('MECHANIC')")
	@GetMapping("/dashboard/mechanic/{mechanicId}")
	public ResponseEntity<?> getMechanicDashboard(@PathVariable Long mechanicId) {
		Long totalJobs = jobCardService.getMechanicJobCardCount(mechanicId);
		List<JobCardResponseDto> assignedJobs = jobCardService.getMechanicJobCardsByStatus(mechanicId,
				JobCardStatus.CREATED);
		List<JobCardResponseDto> inProgress = jobCardService.getMechanicJobCardsByStatus(mechanicId,
				JobCardStatus.IN_PROGRESS);
		Long completedJobs = jobCardService.countMechanicJobCardByStatus(mechanicId, JobCardStatus.COMPLETED);

		MechanicDashboardDto dashboard = MechanicDashboardDto.builder()
				.totalJobCards(totalJobs)
				.assignedJobCards(assignedJobs)
				.inProgressJobCards(inProgress)
				.completedJobCards(completedJobs)
				.build();

		return ResponseEntity.ok(dashboard);
	}

	@PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
	@GetMapping("/revenue/manager/{managerId}")
	public ResponseEntity<?> getManagerRevenue(@PathVariable Long managerId) {
		return ResponseEntity
				.ok(java.util.Collections.singletonMap("revenue", jobCardService.getManagerRevenue(managerId)));
	}

	@PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
	@GetMapping("/team/manager/{managerId}")
	public ResponseEntity<?> getManagerTeamWorkload(@PathVariable Long managerId) {
		return ResponseEntity.ok(jobCardService.getManagerTeamWorkload(managerId));
	}

	@PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
	@GetMapping("/search-history")
	public ResponseEntity<?> searchHistory(@org.springframework.web.bind.annotation.RequestParam String keyword,
			@org.springframework.web.bind.annotation.RequestParam Long managerId) {
		return ResponseEntity.ok(jobCardService.searchHistory(keyword, managerId));
	}

	@PreAuthorize("hasRole('ADMIN')")
	@GetMapping("/revenue/total")
	public ResponseEntity<?> getTotalRevenue() {
		return ResponseEntity.ok(java.util.Collections.singletonMap("totalRevenue", jobCardService.getTotalRevenue()));
	}

	@PreAuthorize("hasRole('CUSTOMER')")
	@GetMapping("/customer/{customerId}")
	public ResponseEntity<?> getCustomerJobCards(@PathVariable Long customerId) {
		return ResponseEntity.ok(jobCardService.getCustomerJobCards(customerId));
	}

	@PreAuthorize("hasRole('CUSTOMER')")
	@PutMapping("/{id}/rate")
	public ResponseEntity<?> rateJobCard(@PathVariable Long id, @RequestBody java.util.Map<String, Object> payload) {
		Integer rating = (Integer) payload.get("rating");
		String feedback = (String) payload.get("feedback");
		JobCardResponseDto result = jobCardService.submitRating(id, rating, feedback);
		return ResponseEntity.ok(result);
	}

}
