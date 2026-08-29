package com.takka.common;

import java.util.Map;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.client.RestClientResponseException;

/** JSON error responses for the API. Scoped so console pages keep rendering HTML errors. */
@Order(20)
@RestControllerAdvice(basePackages = {"com.takka.reports", "com.takka.account"})
public class ApiExceptionHandler {
  @ExceptionHandler(AccessDeniedException.class)
  ResponseEntity<Map<String, String>> denied(AccessDeniedException error) {
    return response(HttpStatus.FORBIDDEN, error.getMessage());
  }

  @ExceptionHandler({IllegalArgumentException.class, MethodArgumentNotValidException.class})
  ResponseEntity<Map<String, String>> badRequest(Exception error) {
    return response(HttpStatus.BAD_REQUEST, error.getMessage());
  }

  @ExceptionHandler(IllegalStateException.class)
  ResponseEntity<Map<String, String>> unavailable(IllegalStateException error) {
    return response(HttpStatus.SERVICE_UNAVAILABLE, error.getMessage());
  }

  @ExceptionHandler(RestClientResponseException.class)
  ResponseEntity<Map<String, String>> upstream(RestClientResponseException error) {
    HttpStatus status = error.getStatusCode().is4xxClientError() ? HttpStatus.BAD_REQUEST : HttpStatus.BAD_GATEWAY;
    return response(status, "Supabase request failed");
  }

  private ResponseEntity<Map<String, String>> response(HttpStatus status, String message) {
    return ResponseEntity.status(status).body(Map.of("error", message == null ? status.getReasonPhrase() : message));
  }
}
