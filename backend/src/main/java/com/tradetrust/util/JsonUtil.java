package com.tradetrust.util;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.io.InputStream;
import java.util.Map;

public class JsonUtil {
    private static final ObjectMapper mapper = new ObjectMapper()
            .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)
            .configure(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS, false);

    public static ObjectMapper getMapper() {
        return mapper;
    }

    public static <T> T fromJson(InputStream is, Class<T> clazz) throws IOException {
        return mapper.readValue(is, clazz);
    }

    public static <T> T fromJson(String json, Class<T> clazz) throws IOException {
        return mapper.readValue(json, clazz);
    }

    public static String toJson(Object obj) {
        try {
            return mapper.writeValueAsString(obj);
        } catch (Exception e) {
            throw new RuntimeException("JSON serialization error", e);
        }
    }

    public static void writeJson(HttpServletResponse response, int statusCode, Object data) throws IOException {
        response.setStatus(statusCode);
        response.setContentType("application/json;charset=UTF-8");
        mapper.writeValue(response.getWriter(), data);
    }

    public static void writeSuccess(HttpServletResponse response, String message, Object data) throws IOException {
        Map<String, Object> body = Map.of(
                "success", true,
                "message", message != null ? message : "Operation successful",
                "data", data != null ? data : Map.of()
        );
        writeJson(response, HttpServletResponse.SC_OK, body);
    }

    public static void writeError(HttpServletResponse response, int statusCode, String message) throws IOException {
        Map<String, Object> body = Map.of(
                "success", false,
                "error", message != null ? message : "An error occurred"
        );
        writeJson(response, statusCode, body);
    }
}
