package com.car_backend.service;

import java.util.List;

import com.car_backend.dto.jobCard.AddItemToJobCardDto;
import com.car_backend.dto.jobCard.AssignMechanicDto;
import com.car_backend.dto.jobCard.CreateJobCardDto;
import com.car_backend.dto.jobCard.JobCardEvidenceDto;
import com.car_backend.dto.jobCard.JobCardResponseDto;
import com.car_backend.entities.JobCardStatus;

import jakarta.validation.Valid;

public interface JobCardService {

	JobCardResponseDto createJobCard(@Valid CreateJobCardDto dto);

	JobCardResponseDto getJobCardById(Long jobCardId);

	List<JobCardResponseDto> getAllJobCards();

	JobCardResponseDto getJobCardByAppointmentId(Long appointmentId);

	JobCardResponseDto updateMechanic(Long jobCardId, AssignMechanicDto dto);

	JobCardResponseDto startWork(Long jobCardId);

	JobCardResponseDto completeWork(Long jobCardId);

	JobCardResponseDto cancelJobCard(Long jobCardId, String reason);

	JobCardResponseDto addItemToJobCard(Long jobCardId, AddItemToJobCardDto dto);

	JobCardResponseDto removeItemsFromJobCard(Long jobCardId, Long itemId);

	JobCardResponseDto getJobCardItems(Long jobCardId);

	JobCardResponseDto addEvidence(Long jobCardId, JobCardEvidenceDto dto);

	JobCardResponseDto removeEvidence(Long jobCardId, Long evidenceId);

	List<JobCardResponseDto> getJobCardByManager(Long managerId);

	List<JobCardResponseDto> getJobCardByMechanic(Long mechanicId);

	List<JobCardResponseDto> getJobCardByStatus(JobCardStatus status);

	List<JobCardResponseDto> getManagerJobCardsByStatus(Long managerId, JobCardStatus status);

	List<JobCardResponseDto> getMechanicJobCardsByStatus(Long mechanicId, JobCardStatus status);

	Long getJobCardCount();

	Long getInProgressCount();

	Long getCompletedCount();

	Long getManagerJobCardCount(Long managerId);

	Long getMechanicJobCardCount(Long mechanicId);

	Long countMechanicJobCardByStatus(Long mechanicId, JobCardStatus status);

	Long countManagerJobCardByStatus(Long managerId, JobCardStatus status);


}
