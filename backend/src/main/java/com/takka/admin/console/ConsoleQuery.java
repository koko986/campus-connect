package com.takka.admin.console;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.StringJoiner;

/**
 * Builds the encoded filter part of a console URL. Pagination links and action redirects reuse it
 * so a chosen filter survives both.
 */
public final class ConsoleQuery {
  private ConsoleQuery() {}

  public static String of(Map<String, String> parameters) {
    var joiner = new StringJoiner("&");
    parameters.forEach((key, value) -> {
      if (value != null && !value.isBlank()) joiner.add(key + "=" + encode(value));
    });
    return joiner.toString();
  }

  /** Percent-encoding rather than {@code +} for spaces, so the link reads the same as it behaves. */
  private static String encode(String value) {
    return URLEncoder.encode(value, StandardCharsets.UTF_8).replace("+", "%20");
  }

  public static String of(String key, String value) {
    var single = new LinkedHashMap<String, String>();
    single.put(key, value);
    return of(single);
  }

  public static String of(String firstKey, String firstValue, String secondKey, String secondValue) {
    var pair = new LinkedHashMap<String, String>();
    pair.put(firstKey, firstValue);
    pair.put(secondKey, secondValue);
    return of(pair);
  }
}
