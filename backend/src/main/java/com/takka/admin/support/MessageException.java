package com.takka.admin.support;

/**
 * A rejected action whose explanation is a message key rather than English text, so the console can
 * report it in the administrator's language.
 *
 * <p>Extends {@link IllegalArgumentException} because that is what the console's exception handler
 * already treats as "the request was understood but refused".
 */
public class MessageException extends IllegalArgumentException {
  private static final long serialVersionUID = 1L;

  private final transient Object[] arguments;

  public MessageException(String key, Object... arguments) {
    super(key);
    this.arguments = arguments == null ? new Object[0] : arguments.clone();
  }

  /** The message key, also carried as the exception message so logs stay useful. */
  public String key() {
    return getMessage();
  }

  public Object[] arguments() {
    return arguments.clone();
  }
}
