package com.takka.admin.session;

/** Sign-in failure with a message safe to show on the login page. */
public class AdminSignInException extends RuntimeException {
  public AdminSignInException(String message) {
    super(message);
  }
}
