package com.takka.admin.model;

import java.util.UUID;

/** A row in the accounts table. */
public record MemberView(
    UUID id,
    String fullName,
    String email,
    String accountType,
    String university,
    String verification,
    AccountStatus status,
    String blockReason,
    String joined,
    String blockedAt,
    boolean administrator) {

  public boolean isBlocked() {
    return status.isBlocked();
  }

  public boolean hasUniversity() {
    return university != null && !university.isBlank();
  }

  public boolean hasBlockReason() {
    return blockReason != null && !blockReason.isBlank();
  }

  /** Administrators are never moderatable, so the console hides their action buttons. */
  public boolean isModeratable() {
    return !administrator;
  }

  public String statusTone() {
    return status.isBlocked() ? "danger" : "success";
  }
}
