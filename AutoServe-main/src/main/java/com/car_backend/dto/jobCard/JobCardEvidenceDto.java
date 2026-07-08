package com.car_backend.dto.jobCard;

import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class JobCardEvidenceDto {
	private Long id;
	private String photoUrl;
	private String description;
	private LocalDateTime uploadedAt;
}
