package com.car_backend.service;

import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;
import java.util.List;

import org.springframework.stereotype.Service;

import com.car_backend.entities.Invoice;
import com.car_backend.entities.JobCard;
import com.car_backend.entities.JobCardItem;
import com.car_backend.entities.User;
import com.car_backend.entities.Vehicle;
import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class PdfServiceImpl implements PdfService {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd-MMM-yyyy HH:mm");

    @Override
    public byte[] generateInvoicePdf(Invoice invoice) {
        Document document = new Document();
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            // Fonts
            Font headFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 24);
            Font subHeadFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14);
            Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 11);
            Font boldFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11);

            // Header
            Paragraph header = new Paragraph("AUTOSERVE", headFont);
            header.setAlignment(Element.ALIGN_CENTER);
            header.setSpacingAfter(20);
            document.add(header);

            Paragraph title = new Paragraph("TAX INVOICE", subHeadFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(20);
            document.add(title);

            // Invoice Details Table
            PdfPTable detailsTable = new PdfPTable(2);
            detailsTable.setWidthPercentage(100);
            detailsTable.setSpacingBefore(10);
            detailsTable.setSpacingAfter(20);

            detailsTable.addCell(getNoBorderCell("Invoice Number: " + invoice.getInvoiceNumber(), boldFont));
            detailsTable.addCell(getNoBorderCell(
                    "Date: " + (invoice.getPaidAt() != null ? invoice.getPaidAt().format(DATE_FORMATTER) : "N/A"),
                    normalFont));

            String status = invoice.getPaymentStatus() != null ? invoice.getPaymentStatus().toString() : "PENDING";
            detailsTable.addCell(getNoBorderCell("Payment Status: " + status, boldFont));
            detailsTable.addCell(getNoBorderCell(
                    "Order ID: " + (invoice.getRazorpayOrderId() != null ? invoice.getRazorpayOrderId() : "N/A"),
                    normalFont));

            document.add(detailsTable);

            // Customer & Vehicle Info
            JobCard jobCard = invoice.getJobCard();
            Vehicle vehicle = (jobCard != null && jobCard.getAppointment() != null)
                    ? jobCard.getAppointment().getVehicleDetails()
                    : null;
            User customer = (vehicle != null) ? vehicle.getCustomer() : null;

            if (customer != null || vehicle != null) {
                PdfPTable clientTable = new PdfPTable(2);
                clientTable.setWidthPercentage(100);
                clientTable.setSpacingAfter(20);

                PdfPCell customerCell = new PdfPCell();
                customerCell.setBorder(PdfPCell.NO_BORDER);
                customerCell.addElement(new Paragraph("Customer Details:", boldFont));
                if (customer != null) {
                    customerCell.addElement(new Paragraph(customer.getUserName(), normalFont));
                    customerCell.addElement(new Paragraph(customer.getEmail(), normalFont));
                    customerCell.addElement(new Paragraph(customer.getMobile(), normalFont));
                }
                clientTable.addCell(customerCell);

                PdfPCell vehicleCell = new PdfPCell();
                vehicleCell.setBorder(PdfPCell.NO_BORDER);
                vehicleCell.addElement(new Paragraph("Vehicle Details:", boldFont));
                if (vehicle != null) {
                    vehicleCell.addElement(new Paragraph(vehicle.getLicensePlate(), normalFont));
                    vehicleCell.addElement(new Paragraph(vehicle.getBrand() + " " + vehicle.getModel(), normalFont));
                }
                clientTable.addCell(vehicleCell);

                document.add(clientTable);
            }

            // Items Table
            if (jobCard != null && jobCard.getItems() != null && !jobCard.getItems().isEmpty()) {
                document.add(new Paragraph("Service/Parts Details:", boldFont));
                PdfPTable itemTable = new PdfPTable(4);
                itemTable.setWidthPercentage(100);
                itemTable.setSpacingBefore(10);
                itemTable.setSpacingAfter(20);
                itemTable.setWidths(new float[] { 4, 1, 2, 2 });

                addTableHeader(itemTable, boldFont);

                List<JobCardItem> items = jobCard.getItems();
                for (JobCardItem item : items) {
                    itemTable.addCell(new Phrase(item.getSnapshotItemName(), normalFont));
                    itemTable.addCell(new Phrase(String.valueOf(item.getQuantity()), normalFont));
                    itemTable.addCell(new Phrase("₹" + item.getSnapshotPrice(), normalFont));
                    itemTable.addCell(new Phrase("₹" + item.getTotalPrice(), normalFont));
                }

                document.add(itemTable);
            }

            // Financial Summary
            PdfPTable summaryTable = new PdfPTable(2);
            summaryTable.setWidthPercentage(40);
            summaryTable.setHorizontalAlignment(Element.ALIGN_RIGHT);
            summaryTable.setSpacingAfter(30);

            addSummaryRow(summaryTable, "Base Amount:", "₹" + invoice.getBaseAmount(), normalFont);
            addSummaryRow(summaryTable, "Labor Cost:",
                    "₹" + (invoice.getLaborCost() != null ? invoice.getLaborCost() : 0.0), normalFont);
            addSummaryRow(summaryTable, "Tax (" + invoice.getTaxPercentage() + "%):", "₹" + invoice.getTaxAmount(),
                    normalFont);
            addSummaryRow(summaryTable, "Grand Total:", "₹" + invoice.getTotalAmount(), boldFont);

            document.add(summaryTable);

            // Footer
            Paragraph footer = new Paragraph("Thank you for choosing AutoServe!\nVisit us again.", normalFont);
            footer.setAlignment(Element.ALIGN_CENTER);
            document.add(footer);

            document.close();
            log.info("PDF generated successfully for invoice: {}", invoice.getInvoiceNumber());

        } catch (Exception e) {
            log.error("Error generating PDF invoice", e);
        }

        return out.toByteArray();
    }

    private PdfPCell getNoBorderCell(String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBorder(PdfPCell.NO_BORDER);
        cell.setPadding(5);
        return cell;
    }

    private void addTableHeader(PdfPTable table, Font font) {
        String[] headers = { "Description", "Qty", "Price", "Total" };
        for (String headerTitle : headers) {
            PdfPCell cell = new PdfPCell(new Phrase(headerTitle, font));
            cell.setBackgroundColor(java.awt.Color.LIGHT_GRAY);
            cell.setHorizontalAlignment(Element.ALIGN_CENTER);
            cell.setPadding(5);
            table.addCell(cell);
        }
    }

    private void addSummaryRow(PdfPTable table, String label, String value, Font font) {
        PdfPCell labelCell = new PdfPCell(new Phrase(label, font));
        labelCell.setBorder(PdfPCell.NO_BORDER);
        labelCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        labelCell.setPadding(5);
        table.addCell(labelCell);

        PdfPCell valueCell = new PdfPCell(new Phrase(value, font));
        valueCell.setBorder(PdfPCell.NO_BORDER);
        valueCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        valueCell.setPadding(5);
        table.addCell(valueCell);
    }
}
