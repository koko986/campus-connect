package com.takka.admin.console;

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
import com.takka.admin.model.AdminIdentity;
import com.takka.admin.model.ReportStatus;
import com.takka.admin.service.ReportModerationService;
import com.takka.admin.support.MessageException;
import com.takka.admin.support.Page;
import com.takka.admin.support.PageRequest;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.web.servlet.MockMvc;

class ConsoleReportsControllerTest {
  private final ReportModerationService reports = mock(ReportModerationService.class);
  private final MockMvc mvc = ConsoleMvc.forController(
      new ConsoleReportsController(reports, ConsoleMvc.layout(), ConsoleMvc.consoleMessages()));

  private final AdminIdentity administrator = Fixtures.moderator();
  private final UUID reportId = UUID.randomUUID();

  @BeforeEach
  void signIn() {
    ConsoleMvc.signIn(administrator);
    when(reports.queue(any(), any())).thenReturn(Page.empty(PageRequest.of(0)));
  }

  @AfterEach
  void signOut() {
    ConsoleMvc.signOut();
  }

  @Test
  void theQueueRendersWithTheConsoleShellAttributes() throws Exception {
    mvc.perform(get("/admin/reports"))
        .andExpect(status().isOk())
        .andExpect(view().name("admin/reports"))
        .andExpect(model().attribute("administrator", administrator))
        .andExpect(model().attribute("section", ConsoleSection.REPORTS))
        .andExpect(model().attribute("superAdmin", false))
        .andExpect(model().attributeExists("navigation", "reports", "statuses", "decisions"));
  }

  @Test
  void anUnknownStatusFilterIsIgnoredRatherThanFailing() throws Exception {
    mvc.perform(get("/admin/reports").param("status", "banana"))
        .andExpect(status().isOk())
        .andExpect(model().attribute("statusFilter", ""))
        .andExpect(model().attribute("filterQuery", ""));

    verify(reports).queue(eq(Optional.empty()), any());
  }

  @Test
  void aKnownStatusFilterIsPassedThroughAndKeptForPaging() throws Exception {
    mvc.perform(get("/admin/reports").param("status", "open"))
        .andExpect(model().attribute("statusFilter", "OPEN"))
        .andExpect(model().attribute("filterQuery", "status=OPEN"));

    verify(reports).queue(eq(Optional.of(ReportStatus.OPEN)), any());
  }

  @Test
  void aDecisionRedirectsBackToTheFilteredQueueWithASuccessFlash() throws Exception {
    when(reports.decide(eq(administrator), eq(reportId), any())).thenReturn(ReportStatus.RESOLVED);

    mvc.perform(post("/admin/reports/{id}/decision", reportId)
            .param("status", "RESOLVED")
            .param("notes", "Blocked the account")
            .param("returnStatus", "OPEN"))
        .andExpect(status().is3xxRedirection())
        .andExpect(redirectedUrl("/admin/reports?status=OPEN"))
        .andExpect(flash().attribute("flashSuccess", "Report marked as resolved."));
  }

  @Test
  void aDecisionIsConfirmedInTheRequestedLanguage() throws Exception {
    when(reports.decide(any(), eq(reportId), any())).thenReturn(ReportStatus.DISMISSED);

    mvc.perform(post("/admin/reports/{id}/decision", reportId)
            .param("status", "DISMISSED")
            .param("notes", "Not a violation")
            .locale(ConsoleMvc.MYANMAR))
        .andExpect(flash().attribute(
            "flashSuccess", "တိုင်ကြားချက်ကို ပယ်ချပြီးအဖြစ် မှတ်လိုက်ပါပြီ။"));
  }

  /** Constraint messages are keys, so a refused form explains itself in the chosen language too. */
  @Test
  void aValidationMessageIsWrittenInTheRequestedLanguage() throws Exception {
    mvc.perform(post("/admin/reports/{id}/decision", reportId)
            .param("status", "RESOLVED")
            .param("notes", "no")
            .locale(ConsoleMvc.MYANMAR))
        .andExpect(flash().attribute(
            "flashError", "မှတ်ချက်သည် အက္ခရာ 3 လုံးမှ 2000 လုံး အတွင်း ဖြစ်ရပါမည်။"));
  }

  @Test
  void missingNotesAreRejectedBeforeTheServiceIsCalled() throws Exception {
    mvc.perform(post("/admin/reports/{id}/decision", reportId).param("status", "RESOLVED").param("notes", "no"))
        .andExpect(redirectedUrl("/admin/reports"))
        .andExpect(flash().attribute("flashError", "Notes must be between 3 and 2000 characters."));

    verify(reports, never()).decide(any(), any(), any());
  }

  @Test
  void aMissingDecisionIsRejected() throws Exception {
    mvc.perform(post("/admin/reports/{id}/decision", reportId).param("status", "").param("notes", "Some notes"))
        .andExpect(redirectedUrl("/admin/reports"))
        .andExpect(flash().attributeExists("flashError"));

    verify(reports, never()).decide(any(), any(), any());
  }

  @Test
  void aRejectedActionSendsTheAdministratorBackWithAnExplanation() throws Exception {
    when(reports.decide(any(), any(), any())).thenThrow(new MessageException("error.report.notFound"));

    mvc.perform(post("/admin/reports/{id}/decision", reportId)
            .param("status", "RESOLVED")
            .param("notes", "Handled it")
            .header("Referer", "http://localhost:8080/admin/reports?status=OPEN"))
        .andExpect(redirectedUrl("/admin/reports?status=OPEN"))
        .andExpect(flash().attribute("flashError", "Report not found."));
  }

  @Test
  void aDeniedActionFallsBackToTheOverviewWhenThereIsNoReferer() throws Exception {
    when(reports.decide(any(), any(), any())).thenThrow(new AccessDeniedException("error.access.superAdmin"));

    mvc.perform(post("/admin/reports/{id}/decision", reportId)
            .param("status", "RESOLVED")
            .param("notes", "Handled it"))
        .andExpect(redirectedUrl("/admin"));
  }

  @Test
  void anOffSiteRefererIsNotUsedAsARedirectTarget() throws Exception {
    when(reports.decide(any(), any(), any())).thenThrow(new IllegalArgumentException("Nope"));

    mvc.perform(post("/admin/reports/{id}/decision", reportId)
            .param("status", "RESOLVED")
            .param("notes", "Handled it")
            .header("Referer", "https://evil.example/admin/reports"))
        .andExpect(redirectedUrl("/admin"));
  }
}
