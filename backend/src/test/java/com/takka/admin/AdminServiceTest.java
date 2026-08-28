package com.takka.admin;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.takka.security.TakkaPrincipal;
import com.takka.supabase.SupabaseGateway;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;
import tools.jackson.databind.ObjectMapper;

class AdminServiceTest {
  private final ObjectMapper mapper = new ObjectMapper();
  private final SupabaseGateway supabase = mock(SupabaseGateway.class);
  private final AdminService service = new AdminService(supabase);
  private final TakkaPrincipal principal = new TakkaPrincipal(UUID.randomUUID(), "admin@takka.test", "token");

  @Test
  void returnsTheAuthenticatedAdminRole() throws Exception {
    when(supabase.get(anyString())).thenReturn(mapper.readTree("[{\"role\":\"SUPER_ADMIN\",\"is_active\":true}]"));

    var result = service.me(principal);

    assertEquals("SUPER_ADMIN", result.get("role"));
    assertEquals(principal.id(), result.get("userId"));
  }

  @Test
  void moderatorCannotUseSuperAdminOperations() throws Exception {
    when(supabase.get(anyString())).thenReturn(mapper.readTree("[{\"role\":\"MODERATOR\",\"is_active\":true}]"));

    assertThrows(AccessDeniedException.class, () -> service.requireAdmin(principal, true));
  }

  @Test
  void inactiveOrMissingAdministratorIsRejected() throws Exception {
    when(supabase.get(anyString())).thenReturn(mapper.readTree("[]"));

    assertThrows(AccessDeniedException.class, () -> service.me(principal));
  }
}
