package com.car_backend.service;

import java.io.IOException;

import org.springframework.web.multipart.MultipartFile;

public interface ImageService {
    String uploadImage(MultipartFile file) throws IOException;
}
