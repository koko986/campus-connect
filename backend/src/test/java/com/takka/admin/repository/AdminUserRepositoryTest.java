package com.takka.admin.repository;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.takka.admin.model.AdminRole;
import com.takka.admin.model.AdminRoleSource;
import com.takka.security.TakkaPrincipal;
import com.takka.supabase.SupabaseGateway;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.ObjectMapper;

class AdminUserRepositoryTest {
  private final ObjectMapper mapper = new ObjectMapper();
  private final SupabaseGateway supabase = mock(SupabaseGateway.class);
  private final AdminUserRepository repository =
      new AdminUserRepository(supabase, "admin@gmail.com");

  @Test
  void bootstrapAdministratorIsUpsertedBeforeTheirRoleIsRead() throws Exception {
    UUID userId = UUID.randomUUID();
    when(supabase.get(any())).thenReturn(mapper.readTree("[{\"role\":\"SUPER_ADMIN\"}]"));

    Optional<AdminRole> role =
        repository.findActiveRole(new TakkaPrincipal(userId, " admin@gmail.com ", "token"));

    assertEquals(Optional.of(AdminRole.SUPER_ADMIN), role);
    verify(supabase).post(eq("admin_users?select=*&on_conflict=user_id"), any(Map.class),
        eq("resolution=merge-duplicates"));
  }

  @Test
  void bootstrapSourceIsReportedForTheDemoAdministrator() throws Exception {
    UUID userId = UUID.randomUUID();
    when(supabase.get(any())).thenReturn(mapper.readTree("[{\"role\":\"SUPER_ADMIN\"}]"));

    var lookup = repository.findActiveRoleWithSource(
        new TakkaPrincipal(userId, "admin@gmail.com", "token"));

    assertEquals(Optional.of(AdminRole.SUPER_ADMIN), lookup.role());
    assertEquals(AdminRoleSource.BOOTSTRAP, lookup.source());
  }

  @Test
  void ordinaryMembersAreOnlyReadFromAdminAssignments() throws Exception {
    UUID userId = UUID.randomUUID();
    when(supabase.get(any())).thenReturn(mapper.readTree("[]"));

    Optional<AdminRole> role =
        repository.findActiveRole(new TakkaPrincipal(userId, "student@gmail.com", "token"));

    assertEquals(Optional.empty(), role);
    verify(supabase, never()).post(any(), any(), any());
  }

  @Test
  void storedAdminAssignmentsReportTheAdminUsersSource() throws Exception {
    UUID userId = UUID.randomUUID();
    when(supabase.get(any())).thenReturn(mapper.readTree("[{\"role\":\"MODERATOR\"}]"));

    var lookup = repository.findActiveRoleWithSource(
        new TakkaPrincipal(userId, "moderator@gmail.com", "token"));

    assertEquals(Optional.of(AdminRole.MODERATOR), lookup.role());
    assertEquals(AdminRoleSource.ADMIN_USERS, lookup.source());
    verify(supabase, never()).post(any(), any(), any());
  }
}
