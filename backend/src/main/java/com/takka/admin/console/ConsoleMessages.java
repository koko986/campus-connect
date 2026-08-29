package com.takka.admin.console;

import com.takka.admin.support.MessageException;
import java.util.Locale;
import java.util.Optional;
import org.springframework.context.MessageSource;
import org.springframework.context.NoSuchMessageException;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.validation.BindingResult;

/**
 * Reads the console's message bundle in the language of the current request. Java-side text -- flash
 * banners, error pages, sign-in failures -- goes through here; text that belongs to a page goes
 * straight into the template as {@code #{key}}.
 */
@Component
public class ConsoleMessages {
  private final MessageSource messages;

  public ConsoleMessages(MessageSource messages) {
    this.messages = messages;
  }

  public String get(String key, Object... arguments) {
    return messages.getMessage(key, arguments, locale());
  }

  /**
   * Resolves a code only when the bundle actually defines it. Exceptions raised deep in the stack
   * carry technical text that must never reach an administrator's screen, so anything unrecognised
   * comes back empty and the caller substitutes a written-for-humans fallback.
   */
  public Optional<String> lookup(String code, Object... arguments) {
    if (code == null || code.isBlank()) return Optional.empty();
    try {
      return Optional.of(messages.getMessage(code, arguments, locale()));
    } catch (NoSuchMessageException untranslated) {
      return Optional.empty();
    }
  }

  /**
   * The banner for a form the validator refused. Constraint messages are already translated, so this
   * only supplies the wording for the case where a binding failure carries no message of its own.
   */
  public String invalidSubmission(BindingResult binding) {
    return Flash.firstMessage(binding).orElseGet(() -> get("flash.invalidSubmission"));
  }

  /** The explanation for a thrown error, falling back to a generic phrase for internal failures. */
  public String explain(Throwable error, String fallbackKey) {
    if (error instanceof MessageException keyed) {
      return lookup(keyed.key(), keyed.arguments()).orElseGet(() -> get(fallbackKey));
    }
    return lookup(error == null ? null : error.getMessage()).orElseGet(() -> get(fallbackKey));
  }

  public Locale locale() {
    return LocaleContextHolder.getLocale();
  }

  public ConsoleLanguage language() {
    return ConsoleLanguage.of(locale());
  }
}
