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
 *
 * <p>Every explanation is resolved from the message bundle. An exception carrying text that is not a
 * known key is reported with a generic phrase instead, so an internal failure cannot leak a
 * technical sentence onto an administrator's screen in the wrong language.
 */
@Order(10)
@ControllerAdvice(basePackageClasses = ConsoleExceptionHandler.class)
public class ConsoleExceptionHandler {
  private static final String FALLBACK = ConsoleSection.OVERVIEW.href();

  private final ConsoleMessages messages;
  private final ConsoleLayout layout;

  public ConsoleExceptionHandler(ConsoleMessages messages, ConsoleLayout layout) {
    this.messages = messages;
    this.layout = layout;
  }

  @ExceptionHandler(AccessDeniedException.class)
  String denied(AccessDeniedException error, HttpServletRequest request) {
    Flash.error(request, messages.explain(error, "error.access.generic"));
    return "redirect:" + returnPath(request);
  }

  @ExceptionHandler(IllegalArgumentException.class)
  String rejected(IllegalArgumentException error, HttpServletRequest request) {
    Flash.error(request, messages.explain(error, "error.action.generic"));
    return "redirect:" + returnPath(request);
  }

  @ExceptionHandler(IllegalStateException.class)
  String misconfigured(IllegalStateException error, Model model) {
    return errorPage(
        model,
        messages.get("error.configuration.title"),
        messages.explain(error, "error.configuration.detail"));
  }

  @ExceptionHandler(RestClientResponseException.class)
  String upstream(RestClientResponseException error, Model model) {
    return errorPage(
        model,
        messages.get("error.upstream.title"),
        messages.get("error.upstream.detail", error.getStatusCode().value()));
  }

  private String errorPage(Model model, String title, String detail) {
    model.addAttribute("errorTitle", title);
    model.addAttribute("errorDetail", detail);
    layout.applyLanguage(model);
    return "admin/error";
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
