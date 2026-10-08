package com.tradetrust.servlet;

import com.tradetrust.util.JsonUtil;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
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
import java.util.Map;
import java.util.UUID;

@WebServlet(urlPatterns = {"/api/upload", "/uploads/*"})
@MultipartConfig(
        fileSizeThreshold = 1024 * 1024,      // 1 MB
        maxFileSize = 10 * 1024 * 1024,       // 10 MB
        maxRequestSize = 20 * 1024 * 1024     // 20 MB
)
public class UploadServlet extends HttpServlet {
    private static final String UPLOAD_DIR = "uploads";

    @Override
    public void init() {
        File dir = new File(UPLOAD_DIR);
        if (!dir.exists()) {
            dir.mkdirs();
        }
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        // Serve uploaded file: /uploads/{filename}
        String path = req.getPathInfo();
        if (path == null || path.length() <= 1) {
            resp.sendError(HttpServletResponse.SC_NOT_FOUND);
            return;
        }

        String filename = path.substring(1);
        // Security check against directory traversal
        if (filename.contains("..") || filename.contains("/") || filename.contains("\\")) {
            resp.sendError(HttpServletResponse.SC_BAD_REQUEST, "Invalid file name");
            return;
        }

        Path file = Paths.get(UPLOAD_DIR, filename).toAbsolutePath().normalize();
        if (!Files.exists(file) || Files.isDirectory(file)) {
            resp.sendError(HttpServletResponse.SC_NOT_FOUND, "File not found");
            return;
        }

        String mimeType = getServletContext().getMimeType(filename);
        if (mimeType == null) {
            String lower = filename.toLowerCase();
            if (lower.endsWith(".pdf")) {
                mimeType = "application/pdf";
            } else if (lower.endsWith(".png")) {
                mimeType = "image/png";
            } else if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
                mimeType = "image/jpeg";
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
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        try {
            Part filePart = req.getPart("file");
            if (filePart == null || filePart.getSize() == 0) {
                // Try checking first available part
                for (Part part : req.getParts()) {
                    if (part.getSubmittedFileName() != null && !part.getSubmittedFileName().isBlank()) {
                        filePart = part;
                        break;
                    }
                }
            }

            if (filePart == null || filePart.getSize() == 0) {
                JsonUtil.writeError(resp, HttpServletResponse.SC_BAD_REQUEST, "No file provided in form-data ('file')");
                return;
            }

            String submittedName = filePart.getSubmittedFileName();
            String extension = "";
            if (submittedName != null && submittedName.contains(".")) {
                extension = submittedName.substring(submittedName.lastIndexOf(".")).toLowerCase();
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
            JsonUtil.writeSuccess(resp, "File uploaded successfully", Map.of(
                    "fileName", savedFileName,
                    "originalName", submittedName != null ? submittedName : "",
                    "url", publicUrl
            ));
        } catch (Exception e) {
            e.printStackTrace();
            JsonUtil.writeError(resp, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "File upload failed: " + e.getMessage());
        }
    }
}
