package com.takka.account;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.takka.admin.model.AdminRole;
import com.takka.admin.repository.AdminUserRepository;
import com.takka.security.TakkaPrincipal;
import com.takka.supabase.SupabaseGateway;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.ObjectMapper;

class AccountControllerTest {
  private final ObjectMapper mapper = new ObjectMapper();
  private final SupabaseGateway supabase = mock(SupabaseGateway.class);
  private final AdminUserRepository administrators = mock(AdminUserRepository.class);
  private final AccountController controller = new AccountController(supabase, administrators);
  private final UUID userId = UUID.randomUUID();
  private final TakkaPrincipal principal = new TakkaPrincipal(userId, "member@takka.test", "token");

  @Test
  void activeMemberIsNotMarkedAsAnAdministrator() throws Exception {
    when(supabase.get(anyString())).thenReturn(mapper.readTree("[]"));
    when(administrators.findActiveRole(userId)).thenReturn(Optional.empty());

    var status = controller.status(principal);

    assertEquals("ACTIVE", status.get("status"));
    assertEquals(false, status.get("administrator"));
    assertFalse(status.containsKey("adminRole"));
  }

  @Test
  void activeAdministratorCarriesTheirConsoleRole() throws Exception {
    when(supabase.get(anyString())).thenReturn(mapper.readTree("[]"));
    when(administrators.findActiveRole(userId)).thenReturn(Optional.of(AdminRole.SUPER_ADMIN));

    var status = controller.status(principal);

    assertTrue((Boolean) status.get("administrator"));
    assertEquals("SUPER_ADMIN", status.get("adminRole"));
  }

  @Test
  void blockedStateAndAdministratorIdentityAreBothPreserved() throws Exception {
    when(supabase.get(anyString())).thenReturn(mapper.readTree(
        "[{\"status\":\"BLOCKED\",\"reason\":\"Review required\",\"blocked_at\":\"2026-09-11T00:00:00Z\"}]"));
    when(administrators.findActiveRole(userId)).thenReturn(Optional.of(AdminRole.MODERATOR));

    var status = controller.status(principal);

    assertEquals("BLOCKED", status.get("status"));
    assertEquals("Review required", status.get("reason"));
    assertEquals("MODERATOR", status.get("adminRole"));
  }
}
