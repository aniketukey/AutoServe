package com.car_backend.dto.jobCard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MechanicWorkloadDto {
    private Long mechanicId;
    private String mechanicName;
    private long activeJobs;
    private long totalJobs;
}
