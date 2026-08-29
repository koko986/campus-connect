package com.takka.admin.session;

import com.takka.admin.model.AdminIdentity;
import com.takka.admin.model.AdminRole;
import java.io.Serializable;
import java.time.Instant;
import java.util.UUID;

/**
 * The console session stored on the {@code HttpSession}. Only identity is kept: every data call
 * goes through the server's Supabase secret key, so no user access token needs to be retained.
 */
public record AdminSession(UUID userId, String email, AdminRole role, Instant signedInAt)
    implements Serializable {

  public static AdminSession of(AdminIdentity identity) {
    return new AdminSession(identity.userId(), identity.email(), identity.role(), Instant.now());
  }

  public AdminIdentity toIdentity() {
    return new AdminIdentity(userId, email, role);
  }

  /** Rebuilds the session with a freshly read role, so a demotion applies without re-login. */
  public AdminSession withRole(AdminRole current) {
    return new AdminSession(userId, email, current, signedInAt);
  }
}
