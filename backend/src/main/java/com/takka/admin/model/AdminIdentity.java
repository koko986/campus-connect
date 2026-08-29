package com.takka.admin.model;

import java.util.UUID;

/** The administrator acting on the current request. */
public record AdminIdentity(UUID userId, String email, AdminRole role) {
  public AdminIdentity {
    if (userId == null) throw new IllegalArgumentException("An administrator id is required");
    if (role == null) throw new IllegalArgumentException("An administrator role is required");
    email = email == null ? "" : email.trim();
  }

  public boolean isSuperAdmin() {
    return role.isSuperAdmin();
  }
}
