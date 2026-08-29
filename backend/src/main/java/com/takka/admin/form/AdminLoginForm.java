package com.takka.admin.form;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Credentials submitted to the console sign-in page. */
public class AdminLoginForm {
  @NotBlank(message = "Enter your administrator email")
  @Email(message = "Enter a valid email address")
  private String email = "";

  @NotBlank(message = "Enter your password")
  @Size(max = 200, message = "Password is too long")
  private String password = "";

  public String getEmail() {
    return email;
  }

  public void setEmail(String email) {
    this.email = email == null ? "" : email.trim();
  }

  public String getPassword() {
    return password;
  }

  public void setPassword(String password) {
    this.password = password == null ? "" : password;
  }
}
