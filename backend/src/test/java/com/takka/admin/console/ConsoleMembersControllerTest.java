package com.takka.admin.console;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.flash;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.model;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.redirectedUrl;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.view;

import com.takka.admin.Fixtures;
import com.takka.admin.form.ModerationReasonForm;
import com.takka.admin.model.AccountStatus;
import com.takka.admin.model.AdminIdentity;
import com.takka.admin.model.MemberFilter;
import com.takka.admin.service.AccountModerationService;
import com.takka.admin.support.Page;
import com.takka.admin.support.PageRequest;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.web.servlet.MockMvc;

class ConsoleMembersControllerTest {
  private final AccountModerationService accounts = mock(AccountModerationService.class);
  private final MockMvc mvc =
      ConsoleMvc.forController(new ConsoleMembersController(accounts, new ConsoleLayout()));

  private final AdminIdentity superAdmin = Fixtures.superAdmin();
  private final UUID memberId = UUID.randomUUID();

  @BeforeEach
  void signIn() {
    ConsoleMvc.signIn(superAdmin);
    when(accounts.members(any(), any())).thenReturn(Page.empty(PageRequest.of(0)));
  }

  @AfterEach
  void signOut() {
    ConsoleMvc.signOut();
  }

  @Test
  void theAccountsPageRendersWithTheConsoleShellAttributes() throws Exception {
    mvc.perform(get("/admin/members"))
        .andExpect(status().isOk())
        .andExpect(view().name("admin/members"))
        .andExpect(model().attribute("section", ConsoleSection.ACCOUNTS))
        .andExpect(model().attribute("superAdmin", true))
        .andExpect(model().attributeExists("members", "filter", "statuses", "filterQuery"));
  }

  @Test
  void theSearchAndStatusFilterReachTheService() throws Exception {
    mvc.perform(get("/admin/members").param("search", " ada ").param("status", "blocked"))
        .andExpect(model().attribute("filterQuery", "search=ada&status=BLOCKED"));

    var captor = ArgumentCaptor.forClass(MemberFilter.class);
    verify(accounts).members(captor.capture(), any());
    assertEquals("ada", captor.getValue().search());
    assertEquals(AccountStatus.BLOCKED, captor.getValue().status().orElseThrow());
  }

  @Test
  void blockingRedirectsBackToTheFilteredListWithASuccessFlash() throws Exception {
    when(accounts.block(eq(superAdmin), eq(memberId), any())).thenReturn("Ada Lovelace");

    mvc.perform(post("/admin/members/{id}/block", memberId)
            .param("reason", "Repeated harassment")
            .param("search", "ada")
            .param("status", "BLOCKED"))
        .andExpect(redirectedUrl("/admin/members?search=ada&status=BLOCKED"))
        .andExpect(flash().attribute(
            "flashSuccess", "Ada Lovelace is now blocked and signed out of every device."));
  }

  @Test
  void aSearchTermIsEncodedIntoTheRedirect() throws Exception {
    when(accounts.block(any(), any(), any())).thenReturn("Ada Lovelace");

    mvc.perform(post("/admin/members/{id}/block", memberId)
            .param("reason", "Repeated harassment")
            .param("search", "ada lovelace"))
        .andExpect(redirectedUrl("/admin/members?search=ada%20lovelace"));
  }

  @Test
  void aTooShortReasonIsRejectedBeforeTheServiceIsCalled() throws Exception {
    mvc.perform(post("/admin/members/{id}/block", memberId).param("reason", "x"))
        .andExpect(redirectedUrl("/admin/members"))
        .andExpect(flash().attribute("flashError", "A reason must be between 3 and 2000 characters"));

    verify(accounts, never()).block(any(), any(), any());
  }

  @Test
  void unblockingReportsTheMemberCanSignInAgain() throws Exception {
    when(accounts.unblock(any(), eq(memberId), any())).thenReturn("Ada Lovelace");

    mvc.perform(post("/admin/members/{id}/unblock", memberId).param("reason", "Appeal accepted"))
        .andExpect(redirectedUrl("/admin/members"))
        .andExpect(flash().attribute("flashSuccess", "Ada Lovelace can sign in again."));
  }

  @Test
  void deletingRequiresBothAReasonAndTheRetypedEmail() throws Exception {
    mvc.perform(post("/admin/members/{id}/delete", memberId).param("reason", "Fraudulent account"))
        .andExpect(redirectedUrl("/admin/members"))
        .andExpect(flash().attribute("flashError", "Retype the member email to confirm deletion"));

    verify(accounts, never()).delete(any(), any(), any());
  }

  @Test
  void deletingReportsTheDeletedEmail() throws Exception {
    when(accounts.delete(any(), eq(memberId), any())).thenReturn("ada@takka.test");

    mvc.perform(post("/admin/members/{id}/delete", memberId)
            .param("reason", "Fraudulent account")
            .param("confirmEmail", "ada@takka.test"))
        .andExpect(redirectedUrl("/admin/members"))
        .andExpect(flash().attribute("flashSuccess", "ada@takka.test has been permanently deleted."));
  }

  @Test
  void aModeratorAttemptingADeletionIsSentBackWithAnExplanation() throws Exception {
    when(accounts.delete(any(), any(), any()))
        .thenThrow(new AccessDeniedException("Super admin access required"));

    mvc.perform(post("/admin/members/{id}/delete", memberId)
            .param("reason", "Fraudulent account")
            .param("confirmEmail", "ada@takka.test")
            .header("Referer", "http://localhost/admin/members?status=BLOCKED"))
        .andExpect(redirectedUrl("/admin/members?status=BLOCKED"))
        .andExpect(flash().attribute("flashError", "Super admin access required"));
  }

  @Test
  void theLinkedReportIdIsBoundSoAnActionCanCloseIt() throws Exception {
    var reportId = UUID.randomUUID();
    when(accounts.block(any(), any(), any())).thenReturn("Ada");

    mvc.perform(post("/admin/members/{id}/block", memberId)
            .param("reason", "Harassment")
            .param("reportId", reportId.toString()))
        .andExpect(redirectedUrl("/admin/members"));

    var captor = ArgumentCaptor.forClass(ModerationReasonForm.class);
    verify(accounts).block(any(), eq(memberId), captor.capture());
    assertEquals(reportId, captor.getValue().getReportId());
  }
}
