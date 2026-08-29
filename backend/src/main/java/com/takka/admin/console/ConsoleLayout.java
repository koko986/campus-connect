package com.takka.admin.console;

import com.takka.admin.model.AdminIdentity;
import jakarta.servlet.http.HttpServletRequest;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;
import org.springframework.ui.Model;

/** Adds the shared shell attributes that every console page renders. */
@Component
public class ConsoleLayout {
  private final ConsoleMessages messages;
  private final HttpServletRequest request;

  public ConsoleLayout(ConsoleMessages messages, HttpServletRequest request) {
    this.messages = messages;
    this.request = request;
  }

  public void apply(Model model, AdminIdentity administrator, ConsoleSection section) {
    model.addAttribute("administrator", administrator);
    model.addAttribute("navigation", ConsoleSection.navigationFor(administrator));
    model.addAttribute("section", section);
    model.addAttribute("pageTitle", messages.get(section.titleKey()));
    model.addAttribute("superAdmin", administrator != null && administrator.isSuperAdmin());
    applyLanguage(model);
  }

  /** The sign-in and error pages have no administrator yet but still offer the language switch. */
  public void applyLanguage(Model model) {
    ConsoleLanguage current = messages.language();
    model.addAttribute("language", current);
    model.addAttribute("languageChoices", choices(current));
  }

  private List<LanguageChoice> choices(ConsoleLanguage current) {
    return Arrays.stream(ConsoleLanguage.values())
        .map(language -> new LanguageChoice(language, hrefFor(language), language == current))
        .toList();
  }

  /**
   * Switching language returns to the same page with the same filters, so an administrator reading a
   * filtered list does not lose their place. Parameters are re-encoded rather than echoed, so the
   * link cannot carry anything unescaped from the current query string.
   */
  private String hrefFor(ConsoleLanguage language) {
    var parameters = new LinkedHashMap<String, String>();
    parseQuery(request.getQueryString(), parameters);
    parameters.put(ConsoleLanguage.PARAMETER, language.tag());
    return request.getRequestURI() + "?" + ConsoleQuery.of(parameters);
  }

  private static void parseQuery(String query, Map<String, String> into) {
    if (query == null || query.isBlank()) return;
    for (String pair : query.split("&")) {
      int separator = pair.indexOf('=');
      String name = decode(separator < 0 ? pair : pair.substring(0, separator));
      if (name.isBlank() || name.equals(ConsoleLanguage.PARAMETER)) continue;
      into.put(name, separator < 0 ? "" : decode(pair.substring(separator + 1)));
    }
  }

  private static String decode(String value) {
    try {
      return URLDecoder.decode(value, StandardCharsets.UTF_8);
    } catch (IllegalArgumentException malformed) {
      return "";
    }
  }
}
