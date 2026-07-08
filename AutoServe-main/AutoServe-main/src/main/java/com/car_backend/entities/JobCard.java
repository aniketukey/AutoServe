package com.car_backend.entities;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.AttributeOverride;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "job_card")
@AttributeOverride(name = "id", column = @Column(name = "job_card_id"))
@Getter
@Setter

public class JobCard extends BaseEntity {

	@OneToOne
	@JoinColumn(name = "appointment_id", unique = true)
	private Appointment appointment;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "manager_id", nullable = false)
	private User manager;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "mechanic_id")
	private User mechanic;

	@Column(name = "start_time")
	private LocalDateTime startTime;

	@Column(name = "completion_time")
	private LocalDateTime completionTime;

	@Column(name = "estimated_completion_date")
	private LocalDate estimatedCompletionDate;
	
	@Column(name="cancellation_reason")
	private String cancellationReason;

	@Enumerated(EnumType.STRING)
	@Column(name = "job_card_status", nullable = false)
	private JobCardStatus jobCardStatus;

	@OneToMany(mappedBy = "jobCard", cascade = CascadeType.ALL, orphanRemoval = true)
	private List<JobCardItem> items = new ArrayList<>();

	@OneToMany(mappedBy = "jobCard", cascade = CascadeType.ALL, orphanRemoval = true)
	private List<JobCardEvidence> evidences = new ArrayList<>();

}
