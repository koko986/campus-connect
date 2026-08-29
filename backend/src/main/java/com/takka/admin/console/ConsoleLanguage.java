package com.takka.admin.console;

import java.util.Locale;
import java.util.Optional;

/**
 * The languages the console is published in. Each name is written in its own language, because a
 * language switch is the one label that must be readable to someone who cannot read the current
 * one.
 */
public enum ConsoleLanguage {
  EN("en", "English"),
  MY("my", "မြန်မာ");

  /** Query parameter that switches language, as in {@code /admin/reports?lang=my}. */
  public static final String PARAMETER = "lang";

  private final String tag;
  private final String nativeName;

  ConsoleLanguage(String tag, String nativeName) {
    this.tag = tag;
    this.nativeName = nativeName;
  }

  public String tag() {
    return tag;
  }

  public String nativeName() {
    return nativeName;
  }

  public Locale locale() {
    return Locale.of(tag);
  }

  /** Matches on language only, so a regional tag such as {@code my-MM} still resolves. */
  public static ConsoleLanguage of(Locale locale) {
    return locale == null ? EN : parse(locale.getLanguage()).orElse(EN);
  }

  public static Optional<ConsoleLanguage> parse(String value) {
    if (value == null || value.isBlank()) return Optional.empty();
    String tag = value.trim().toLowerCase(Locale.ROOT);
    for (ConsoleLanguage language : values()) {
      if (language.tag.equals(tag)) return Optional.of(language);
    }
    return Optional.empty();
  }
}
