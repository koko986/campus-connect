package com.takka.admin.session;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.takka.admin.form.AdminLoginForm;
import com.takka.admin.model.AdminIdentity;
import com.takka.admin.model.AdminRole;
import com.takka.admin.repository.AdminUserRepository;
import com.takka.security.TakkaPrincipal;
import com.takka.supabase.SupabaseGateway;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.client.HttpClientErrorException;

class AdminSessionServiceTest {
  private final SupabaseGateway supabase = mock(SupabaseGateway.class);
  private final AdminUserRepository adminUsers = mock(AdminUserRepository.class);
  private final AdminSessionService service = new AdminSessionService(supabase, adminUsers);

  private final UUID userId = UUID.randomUUID();

  private AdminLoginForm credentials() {
    var form = new AdminLoginForm();
    form.setEmail("super@takka.test");
    form.setPassword("correct-horse");
    return form;
  }

  private void supabaseAccepts() {
    when(supabase.signInWithPassword(any(), any()))
        .thenReturn(new TakkaPrincipal(userId, "super@takka.test", "token"));
  }

  private AdminIdentity identity(AdminRole role) {
    return new AdminIdentity(userId, "super@takka.test", role);
  }

  @Test
  void anAdministratorSignsInWithTheirStoredRole() {
    supabaseAccepts();
    when(adminUsers.findActiveRole(userId)).thenReturn(Optional.of(AdminRole.SUPER_ADMIN));

    var signedIn = service.signIn(credentials());

    assertEquals(userId, signedIn.userId());
    assertEquals(AdminRole.SUPER_ADMIN, signedIn.role());
    assertEquals("super@takka.test", signedIn.email());
  }

  @Test
  void validMemberCredentialsAreStillRefusedWithoutAnAdminAssignment() {
    supabaseAccepts();
    when(adminUsers.findActiveRole(userId)).thenReturn(Optional.empty());

    var error = assertThrows(AdminSignInException.class, () -> service.signIn(credentials()));

    assertEquals("This account is not a TAKKA administrator", error.getMessage());
  }

  @Test
  void badCredentialsAreReportedWithoutRevealingWhichPartFailed() {
    when(supabase.signInWithPassword(any(), any()))
        .thenThrow(new IllegalArgumentException("Invalid email or password"));

    var error = assertThrows(AdminSignInException.class, () -> service.signIn(credentials()));

    assertEquals("Invalid email or password", error.getMessage());
  }

  @Test
  void aSupabaseRejectionBecomesASignInFailure() {
    when(supabase.signInWithPassword(any(), any()))
        .thenThrow(new HttpClientErrorException(HttpStatus.BAD_REQUEST));

    var error = assertThrows(AdminSignInException.class, () -> service.signIn(credentials()));

    assertEquals("Invalid email or password", error.getMessage());
  }

  @Test
  void rateLimitingIsReportedDistinctly() {
    when(supabase.signInWithPassword(any(), any()))
        .thenThrow(new HttpClientErrorException(HttpStatus.TOO_MANY_REQUESTS));

    var error = assertThrows(AdminSignInException.class, () -> service.signIn(credentials()));

    assertTrue(error.getMessage().startsWith("Too many sign-in attempts"));
  }

  @Test
  void beginningASessionReplacesAnyExistingSessionId() {
    var request = new MockHttpServletRequest();
    var firstId = request.getSession(true).getId();

    service.begin(request, identity(AdminRole.SUPER_ADMIN));

    assertNotEquals(firstId, request.getSession(false).getId());
    assertEquals(identity(AdminRole.SUPER_ADMIN), service.read(request).orElseThrow().toIdentity());
  }

  @Test
  void readingReturnsEmptyWhenThereIsNoSession() {
    assertTrue(service.read(new MockHttpServletRequest()).isEmpty());
  }

  @Test
  void endingASessionClearsTheStoredIdentity() {
    var request = new MockHttpServletRequest();
    service.begin(request, identity(AdminRole.MODERATOR));

    service.end(request);

    assertTrue(service.read(request).isEmpty());
  }

  @Test
  void theStoredRoleIsRefreshedInPlace() {
    var request = new MockHttpServletRequest();
    service.begin(request, identity(AdminRole.MODERATOR));
    var stored = service.read(request).orElseThrow();

    service.refreshRole(request, stored, AdminRole.SUPER_ADMIN);

    assertEquals(AdminRole.SUPER_ADMIN, service.read(request).orElseThrow().role());
  }

  @Test
  void currentRoleIsReadFromTheDatabaseRatherThanTheSession() {
    when(adminUsers.findActiveRole(userId)).thenReturn(Optional.of(AdminRole.MODERATOR));
    var session = new AdminSession(userId, "a@b.c", AdminRole.SUPER_ADMIN, Instant.now());

    assertEquals(Optional.of(AdminRole.MODERATOR), service.currentRole(session));
  }
}
