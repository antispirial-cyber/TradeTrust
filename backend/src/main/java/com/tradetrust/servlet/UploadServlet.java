package com.tradetrust.servlet;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.Part;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Handles file uploads and static file serving:
 *   POST /api/upload -> multipart form data ('file')
 *   GET  /uploads/{fileName} -> serves image or PDF document inline
 */
public class UploadServlet extends ApiServlet {

    private static final String UPLOAD_DIR = "uploads";

    @Override
    public void init() {
        File dir = new File(UPLOAD_DIR);
        if (!dir.exists()) {
            dir.mkdirs();
        }
    }

    @Override
    protected void get(HttpServletRequest req, HttpServletResponse resp) throws Exception {
        String path = req.getPathInfo();
        if (path == null || path.length() <= 1) {
            fail(resp, 404, "File not specified");
            return;
        }

        String filename = path.substring(1);
        if (filename.contains("..") || filename.contains("/") || filename.contains("\\")) {
            fail(resp, 400, "Invalid file name");
            return;
        }

        Path file = Paths.get(UPLOAD_DIR, filename).toAbsolutePath().normalize();
        if (!Files.exists(file) || Files.isDirectory(file)) {
            fail(resp, 404, "File not found");
            return;
        }

        String lower = filename.toLowerCase();
        if (!lower.endsWith(".png") && !lower.endsWith(".jpg") && !lower.endsWith(".jpeg") && !lower.endsWith(".webp") && !lower.endsWith(".pdf")) {
            fail(resp, 400, "Unsupported file format");
            return;
        }

        String mimeType = getServletContext().getMimeType(filename);
        if (mimeType == null) {
            if (lower.endsWith(".pdf")) {
                mimeType = "application/pdf";
            } else if (lower.endsWith(".png")) {
                mimeType = "image/png";
            } else if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
                mimeType = "image/jpeg";
            } else if (lower.endsWith(".webp")) {
                mimeType = "image/webp";
            } else {
                mimeType = "application/octet-stream";
            }
        }

        resp.setContentType(mimeType);
        resp.setHeader("Content-Disposition", "inline; filename=\"" + filename + "\"");
        resp.setContentLengthLong(Files.size(file));
        Files.copy(file, resp.getOutputStream());
    }

    @Override
    protected void post(HttpServletRequest req, HttpServletResponse resp) throws Exception {
        com.tradetrust.model.Session session = requireLogin(req, resp);
        if (session == null) return;

        Part filePart = null;
        try {
            filePart = req.getPart("file");
            if (filePart == null || filePart.getSize() == 0) {
                for (Part p : req.getParts()) {
                    if (p.getSubmittedFileName() != null && !p.getSubmittedFileName().isBlank()) {
                        filePart = p;
                        break;
                    }
                }
            }
        } catch (Exception e) {
            fail(resp, 400, "Multipart processing error: " + e.getMessage());
            return;
        }

        if (filePart == null || filePart.getSize() == 0) {
            fail(resp, 400, "No file provided in form-data ('file')");
            return;
        }

        String submittedName = filePart.getSubmittedFileName();
        String extension = "";
        if (submittedName != null && submittedName.contains(".")) {
            extension = submittedName.substring(submittedName.lastIndexOf(".")).toLowerCase();
        }

        if (!extension.equals(".png") && !extension.equals(".jpg") && !extension.equals(".jpeg") && !extension.equals(".webp") && !extension.equals(".pdf")) {
            fail(resp, 400, "Unsupported file format. Only PNG, JPG, WEBP images and PDF documents are allowed.");
            return;
        }

        String savedFileName = UUID.randomUUID() + extension;
        Path target = Paths.get(UPLOAD_DIR, savedFileName).toAbsolutePath().normalize();
        if (target.getParent() != null && !Files.exists(target.getParent())) {
            Files.createDirectories(target.getParent());
        }

        try (InputStream in = filePart.getInputStream()) {
            Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
        }

        String publicUrl = "/uploads/" + savedFileName;
        Map<String, Object> data = new HashMap<>();
        data.put("fileName", savedFileName);
        data.put("originalName", submittedName != null ? submittedName : savedFileName);
        data.put("url", publicUrl);

        ok(resp, "File uploaded successfully", data);
    }
}
