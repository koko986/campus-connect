package com.takka.admin.form;

import jakarta.validation.constraints.NotBlank;

/**
 * Deleting a member is irreversible, so the console asks the administrator to retype the target
 * email. The typed value is compared against the stored account inside the service.
 */
public class MemberDeleteForm extends ModerationReasonForm {
  @NotBlank(message = "Retype the member email to confirm deletion")
  private String confirmEmail = "";

  public String getConfirmEmail() {
    return confirmEmail;
  }

  public void setConfirmEmail(String confirmEmail) {
    this.confirmEmail = confirmEmail == null ? "" : confirmEmail.trim();
  }

  public boolean matches(String email) {
    return email != null && confirmEmail.equalsIgnoreCase(email.trim());
  }
}
