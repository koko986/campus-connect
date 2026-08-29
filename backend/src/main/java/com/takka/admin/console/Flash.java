package com.takka.admin.console;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.validation.BindingResult;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
import org.springframework.web.servlet.support.RequestContextUtils;

/**
 * One-shot banners carried across the redirect that follows every console action, so a result is
 * reported on the refreshed page instead of leaving a re-submittable POST in the browser.
 */
public final class Flash {
  public static final String SUCCESS = "flashSuccess";
  public static final String ERROR = "flashError";

  private Flash() {}

  public static void success(RedirectAttributes attributes, String message) {
    attributes.addFlashAttribute(SUCCESS, message);
  }

  public static void error(RedirectAttributes attributes, String message) {
    attributes.addFlashAttribute(ERROR, message);
  }

  /** Used from exception handlers, which cannot rely on redirect attribute binding. */
  public static void error(HttpServletRequest request, String message) {
    RequestContextUtils.getOutputFlashMap(request).put(ERROR, message);
  }

  /** The first validation message, which is what the console banner shows. */
  public static String firstMessage(BindingResult binding) {
    return binding.getAllErrors().stream()
        .map(error -> error.getDefaultMessage())
        .filter(message -> message != null && !message.isBlank())
        .findFirst()
        .orElse("Please check the submitted values");
  }
}
