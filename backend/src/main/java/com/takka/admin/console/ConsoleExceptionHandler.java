package com.takka.admin.console;

import jakarta.servlet.http.HttpServletRequest;
import java.net.URI;
import java.net.URISyntaxException;
import org.springframework.core.annotation.Order;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.client.RestClientResponseException;

/**
 * Console-only error handling. Rejected actions send the administrator back to the page they came
 * from with an explanation; infrastructure failures render a plain console error page.
 *
 * <p>Scoped to console controllers so the JSON API keeps returning JSON errors.
 */
@Order(10)
@ControllerAdvice(basePackageClasses = ConsoleExceptionHandler.class)
public class ConsoleExceptionHandler {
  private static final String FALLBACK = ConsoleSection.OVERVIEW.href();

  @ExceptionHandler(AccessDeniedException.class)
  String denied(AccessDeniedException error, HttpServletRequest request) {
    Flash.error(request, message(error, "You do not have permission to do that"));
    return "redirect:" + returnPath(request);
  }

  @ExceptionHandler(IllegalArgumentException.class)
  String rejected(IllegalArgumentException error, HttpServletRequest request) {
    Flash.error(request, message(error, "That action could not be completed"));
    return "redirect:" + returnPath(request);
  }

  @ExceptionHandler(IllegalStateException.class)
  String misconfigured(IllegalStateException error, Model model) {
    model.addAttribute("errorTitle", "The console is not fully configured");
    model.addAttribute("errorDetail", message(error, "A required server setting is missing."));
    return "admin/error";
  }

  @ExceptionHandler(RestClientResponseException.class)
  String upstream(RestClientResponseException error, Model model) {
    model.addAttribute("errorTitle", "Supabase could not be reached");
    model.addAttribute(
        "errorDetail",
        "The database rejected or dropped the request (status " + error.getStatusCode().value() + ").");
    return "admin/error";
  }

  private static String message(Exception error, String fallback) {
    String message = error.getMessage();
    return message == null || message.isBlank() ? fallback : message;
  }

  /**
   * The console page to return to. Only same-origin console paths are accepted, so a crafted
   * referer cannot turn an error into an open redirect.
   */
  private static String returnPath(HttpServletRequest request) {
    String referer = request.getHeader("Referer");
    if (referer == null || referer.isBlank()) return FALLBACK;
    try {
      URI uri = new URI(referer);
      String host = uri.getHost();
      if (host != null && !host.equalsIgnoreCase(request.getServerName())) return FALLBACK;
      String path = uri.getPath();
      if (path == null || !path.startsWith("/admin")) return FALLBACK;
      return uri.getRawQuery() == null ? path : path + "?" + uri.getRawQuery();
    } catch (URISyntaxException malformed) {
      return FALLBACK;
    }
  }
}
