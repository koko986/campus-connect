package com.takka.admin.session;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.takka.admin.model.AdminIdentity;
import com.takka.admin.model.AdminRole;
import com.takka.admin.repository.AdminUserRepository;
import com.takka.supabase.SupabaseGateway;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

class AdminSessionFilterTest {
  private final SupabaseGateway supabase = mock(SupabaseGateway.class);
  private final AdminUserRepository adminUsers = mock(AdminUserRepository.class);
  private final AdminSessionService sessions = new AdminSessionService(supabase, adminUsers);
  private final AdminSessionFilter filter = new AdminSessionFilter(sessions);

  private final UUID userId = UUID.randomUUID();

  @AfterEach
  void clearContext() {
    SecurityContextHolder.clearContext();
  }

  private MockHttpServletRequest signedInRequest(AdminRole role) {
    var request = new MockHttpServletRequest("GET", "/admin/reports");
    sessions.begin(request, new AdminIdentity(userId, "super@takka.test", role));
    return request;
  }

  private void runFilter(MockHttpServletRequest request) throws Exception {
    filter.doFilter(request, new MockHttpServletResponse(), new MockFilterChain());
  }

  @Test
  void aRequestWithoutASessionStaysUnauthenticated() throws Exception {
    runFilter(new MockHttpServletRequest("GET", "/admin"));

    assertNull(SecurityContextHolder.getContext().getAuthentication());
  }

  @Test
  void anActiveAdministratorIsAuthenticatedWithBothAuthorities() throws Exception {
    when(adminUsers.findActiveRole(userId)).thenReturn(Optional.of(AdminRole.SUPER_ADMIN));

    runFilter(signedInRequest(AdminRole.SUPER_ADMIN));

    var authentication = SecurityContextHolder.getContext().getAuthentication();
    assertNotNull(authentication);
    assertEquals(AdminRole.SUPER_ADMIN, ((AdminIdentity) authentication.getPrincipal()).role());
    assertTrue(authentication.getAuthorities().stream()
        .anyMatch(granted -> granted.getAuthority().equals(AdminSessionFilter.ADMIN_AUTHORITY)));
    assertTrue(authentication.getAuthorities().stream()
        .anyMatch(granted -> granted.getAuthority().equals("ROLE_SUPER_ADMIN")));
  }

  /** Revoking an assignment must take effect immediately, not when the session happens to expire. */
  @Test
  void aRevokedAdministratorLosesTheirSessionOnTheNextRequest() throws Exception {
    var request = signedInRequest(AdminRole.SUPER_ADMIN);
    when(adminUsers.findActiveRole(userId)).thenReturn(Optional.empty());

    runFilter(request);

    assertNull(SecurityContextHolder.getContext().getAuthentication());
    assertTrue(sessions.read(request).isEmpty());
  }

  @Test
  void aDemotedAdministratorIsAuthenticatedWithTheirCurrentRole() throws Exception {
    var request = signedInRequest(AdminRole.SUPER_ADMIN);
    when(adminUsers.findActiveRole(userId)).thenReturn(Optional.of(AdminRole.MODERATOR));

    runFilter(request);

    var authentication = SecurityContextHolder.getContext().getAuthentication();
    assertEquals(AdminRole.MODERATOR, ((AdminIdentity) authentication.getPrincipal()).role());
    assertEquals(AdminRole.MODERATOR, sessions.read(request).orElseThrow().role());
  }
}
