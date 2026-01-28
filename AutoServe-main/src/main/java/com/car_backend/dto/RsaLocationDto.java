package com.car_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RsaLocationDto {
	private Double latitude;
	private Double longitude;

	public static RsaLocationDto fromCoordinates(String coordinates) {
		if (coordinates == null || coordinates.trim().isEmpty()) {
			return null;
		}

		String[] parts = coordinates.split(",");
		if (parts.length != 2) {
			return null;
		}

		try {
			return new RsaLocationDto(Double.parseDouble(parts[0].trim()), Double.parseDouble(parts[1].trim()));
		} catch (NumberFormatException e) {
			return null;
		}
	}

	public String toCoordinates() {
		return latitude + "," + longitude;
	}
}
