package com.takka.admin.service;

import static com.takka.admin.Fixtures.json;
import static com.takka.admin.Fixtures.moderator;
import static com.takka.admin.Fixtures.superAdmin;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.takka.admin.form.MemberDeleteForm;
import com.takka.admin.form.ModerationReasonForm;
import com.takka.admin.model.MemberFilter;
import com.takka.admin.model.ModerationAction;
import com.takka.admin.repository.AccountModerationRepository;
import com.takka.admin.repository.AdminUserRepository;
import com.takka.admin.repository.ProfileRepository;
import com.takka.admin.support.Page;
import com.takka.admin.support.PageRequest;
import com.takka.supabase.SupabaseGateway;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;
import tools.jackson.databind.JsonNode;

class AccountModerationServiceTest {
  private final ProfileRepository profiles = mock(ProfileRepository.class);
  private final AccountModerationRepository moderation = mock(AccountModerationRepository.class);
  private final AdminUserRepository adminUsers = mock(AdminUserRepository.class);
  private final ReportModerationService reports = mock(ReportModerationService.class);
  private final AuditTrailService auditTrail = mock(AuditTrailService.class);
  private final SupabaseGateway supabase = mock(SupabaseGateway.class);

  private final AccountModerationService service =
      new AccountModerationService(profiles, moderation, adminUsers, reports, auditTrail, supabase);

  private final UUID memberId = UUID.randomUUID();

  private JsonNode member() {
    return json(
        "{\"id\":\"" + memberId + "\",\"email\":\"ada@takka.test\",\"full_name\":\"Ada Lovelace\"}");
  }

  private ModerationReasonForm reason(String text) {
    var form = new ModerationReasonForm();
    form.setReason(text);
    return form;
  }

  private MemberDeleteForm deleteForm(String reason, String confirmEmail) {
    var form = new MemberDeleteForm();
    form.setReason(reason);
    form.setConfirmEmail(confirmEmail);
    return form;
  }

  @Test
  void blockingBansTheAuthUserRecordsTheReasonAndAudits() {
    when(profiles.requireById(memberId)).thenReturn(member());

    var name = service.block(superAdmin(), memberId, reason("Repeated harassment"));

    assertEquals("Ada Lovelace", name);
    verify(supabase).updateAuthUser(eq(memberId), any());
    verify(moderation).block(eq(memberId), eq("Repeated harassment"), any());
    verify(auditTrail)
        .record(any(), eq(ModerationAction.BLOCK_USER), eq(memberId), eq("Repeated harassment"), any(), any());
  }

  @Test
  void unblockingLiftsTheBanAndClearsTheBlockColumns() {
    when(profiles.requireById(memberId)).thenReturn(member());

    var name = service.unblock(moderator(), memberId, reason("Appeal accepted"));

    assertEquals("Ada Lovelace", name);
    verify(moderation).unblock(memberId, "Appeal accepted");
    verify(auditTrail).record(any(), eq(ModerationAction.UNBLOCK_USER), eq(memberId), any(), any(), any());
  }

  @Test
  void anAdministratorCannotModerateTheirOwnAccount() {
    var administrator = superAdmin();

    var error = assertThrows(
        IllegalArgumentException.class,
        () -> service.block(administrator, administrator.userId(), reason("Testing")));

    assertEquals("You cannot moderate your own account", error.getMessage());
    verify(supabase, never()).updateAuthUser(any(), any());
  }

  @Test
  void anotherActiveAdministratorCannotBeModerated() {
    when(adminUsers.isActiveAdmin(memberId)).thenReturn(true);

    assertThrows(AccessDeniedException.class, () -> service.block(superAdmin(), memberId, reason("Testing")));

    verify(moderation, never()).block(any(), any(), any());
  }

  @Test
  void deletingAnAccountRequiresSuperAdmin() {
    assertThrows(
        AccessDeniedException.class,
        () -> service.delete(moderator(), memberId, deleteForm("Fraud", "ada@takka.test")));

    verify(supabase, never()).deleteAuthUser(any());
  }

  @Test
  void deletingAnAccountRequiresTheEmailToBeRetypedCorrectly() {
    when(profiles.requireById(memberId)).thenReturn(member());

    var error = assertThrows(
        IllegalArgumentException.class,
        () -> service.delete(superAdmin(), memberId, deleteForm("Fraud", "someone@else.test")));

    assertEquals("The confirmation email does not match this member", error.getMessage());
    verify(supabase, never()).deleteAuthUser(any());
  }

  @Test
  void deletingAnAccountMatchesTheEmailCaseInsensitively() {
    when(profiles.requireById(memberId)).thenReturn(member());

    var email = service.delete(superAdmin(), memberId, deleteForm("Fraud", "  ADA@Takka.test "));

    assertEquals("ada@takka.test", email);
    verify(supabase).deleteAuthUser(memberId);
    verify(auditTrail).record(any(), eq(ModerationAction.DELETE_USER), eq(memberId), eq("Fraud"), any(), any());
  }

  @Test
  void aLinkedReportIsClosedWhenAnAccountIsBlocked() {
    when(profiles.requireById(memberId)).thenReturn(member());
    var reportId = UUID.randomUUID();
    var form = reason("Harassment");
    form.setReportId(reportId);

    service.block(superAdmin(), memberId, form);

    verify(reports).closeLinkedReport(any(), eq(Optional.of(reportId)), eq("Harassment"));
  }

  @Test
  void listingMembersMarksAdministratorsAsProtected() {
    var request = PageRequest.of(0, 25);
    when(adminUsers.findActiveAdministratorIds()).thenReturn(Set.of(memberId));
    when(moderation.findBlockedUserIds()).thenReturn(List.of());
    when(profiles.findMembers(any(MemberFilter.class), eq(request), eq(List.of())))
        .thenReturn(new Page<>(
            List.of(json("{\"id\":\"" + memberId + "\",\"full_name\":\"Ada\",\"email\":\"ada@takka.test\"}")),
            0,
            25,
            false));

    var page = service.members(MemberFilter.none(), request);

    assertEquals(1, page.items().size());
    assertEquals(false, page.items().get(0).isModeratable());
  }

  @Test
  void countsComeFromTheRepositories() {
    when(profiles.countAll()).thenReturn(120L);
    when(moderation.countBlocked()).thenReturn(7L);

    assertEquals(120L, service.totalMembers());
    assertEquals(7L, service.blockedMembers());
  }
}
