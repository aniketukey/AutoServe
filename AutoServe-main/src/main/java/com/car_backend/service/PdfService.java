package com.car_backend.service;

import com.car_backend.entities.Invoice;

public interface PdfService {
    byte[] generateInvoicePdf(Invoice invoice);
}
