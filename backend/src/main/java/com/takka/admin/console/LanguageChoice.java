package com.takka.admin.console;

/** One option in the console's language switch, already resolved to a link the template can use. */
public record LanguageChoice(ConsoleLanguage language, String href, boolean active) {
  public String nativeName() {
    return language.nativeName();
  }

  public String tag() {
    return language.tag();
  }
}
