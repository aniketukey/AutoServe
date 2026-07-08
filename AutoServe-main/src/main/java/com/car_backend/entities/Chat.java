package com.car_backend.entities;

import jakarta.persistence.AttributeOverride;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name="chat")
@AttributeOverride(name="id", column=@Column(name="chat_id"))
@Getter
@Setter

public class Chat extends BaseEntity{
	
	private String message;
	
	@Column(name="is_read")
	private boolean isRead;
	
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name="job_card_id")
	private JobCard jobCard;
	
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name="sender_id")
	private User sender;
}
