package com.car_backend.dto.jobCard;

import java.util.List;

import lombok.Builder;
import lombok.Data;

@Data
@Builder

public class MechanicDashboardDto {
	private Long totalJobCards;
	private List<JobCardResponseDto> assignedJobCards;
	private List<JobCardResponseDto> inProgressJobCards;
	private Long completedJobCards;
}
