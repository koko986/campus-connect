package com.takka.admin.session;

/**
 * Sign-in failure. The message is a console message key rather than a sentence, so the login page
 * can explain the refusal in the language the visitor selected before signing in.
 */
public class AdminSignInException extends RuntimeException {
  private static final long serialVersionUID = 1L;

  public AdminSignInException(String messageKey) {
    super(messageKey);
  }

  public String key() {
    return getMessage();
  }
}
