package com.takka.admin.service;

import com.takka.admin.model.AdminIdentity;
import org.springframework.security.access.AccessDeniedException;

/**
 * Privilege checks applied inside the service layer. URL rules already keep non-administrators out
 * of the console, so these assertions exist to stop a moderator reaching a super-admin-only action
 * even if a route or template ever exposes one by mistake.
 *
 * <p>The denial messages are console message keys, which the console's exception handler resolves in
 * the administrator's language.
 */
public final class AdminAccess {
  private AdminAccess() {}

  public static void requireSuperAdmin(AdminIdentity administrator) {
    if (administrator == null || !administrator.isSuperAdmin()) {
      throw new AccessDeniedException("error.access.superAdmin");
    }
  }

  public static void requireAdministrator(AdminIdentity administrator) {
    if (administrator == null) throw new AccessDeniedException("error.access.administrator");
  }
}
