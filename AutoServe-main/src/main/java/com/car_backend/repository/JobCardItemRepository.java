package com.car_backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.car_backend.entities.JobCardItem;

public interface JobCardItemRepository extends JpaRepository<JobCardItem, Long> {
	Optional<JobCardItem> findByIdAndJobCardId(Long itemId, Long jobCardId);
}
