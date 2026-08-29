package com.takka.admin.service;

import static com.takka.admin.Fixtures.moderator;
import static com.takka.admin.Fixtures.superAdmin;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;

class AdminAccessTest {
  @Test
  void aSuperAdminPassesBothChecks() {
    assertDoesNotThrow(() -> AdminAccess.requireSuperAdmin(superAdmin()));
    assertDoesNotThrow(() -> AdminAccess.requireAdministrator(superAdmin()));
  }

  @Test
  void aModeratorIsRefusedSuperAdminOperations() {
    assertThrows(AccessDeniedException.class, () -> AdminAccess.requireSuperAdmin(moderator()));
    assertDoesNotThrow(() -> AdminAccess.requireAdministrator(moderator()));
  }

  @Test
  void anAbsentIdentityIsRefusedEverything() {
    assertThrows(AccessDeniedException.class, () -> AdminAccess.requireSuperAdmin(null));
    assertThrows(AccessDeniedException.class, () -> AdminAccess.requireAdministrator(null));
  }
}
