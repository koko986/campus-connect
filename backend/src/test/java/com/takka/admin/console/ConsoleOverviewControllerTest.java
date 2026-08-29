package com.takka.admin.console;

import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.model;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.view;

import com.takka.admin.Fixtures;
import com.takka.admin.model.OverviewMetrics;
import com.takka.admin.service.AdminOverviewService;
import com.takka.admin.service.AuditTrailService;
import com.takka.admin.service.ReportModerationService;
import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;

class ConsoleOverviewControllerTest {
  private final AdminOverviewService overview = mock(AdminOverviewService.class);
  private final ReportModerationService reports = mock(ReportModerationService.class);
  private final AuditTrailService auditTrail = mock(AuditTrailService.class);
  private final MockMvc mvc = ConsoleMvc.forController(
      new ConsoleOverviewController(overview, reports, auditTrail, ConsoleMvc.layout()));

  private final OverviewMetrics metrics = new OverviewMetrics(4, 2, 1, 120, 3, 40, 12);

  @BeforeEach
  void stubServices() {
    when(overview.metrics()).thenReturn(metrics);
    when(reports.oldestUnresolved(anyInt())).thenReturn(List.of());
    when(auditTrail.recentEntries(anyInt())).thenReturn(List.of());
  }

  @AfterEach
  void signOut() {
    ConsoleMvc.signOut();
  }

  @Test
  void theOverviewRendersTheMetricsAndPreviewLists() throws Exception {
    ConsoleMvc.signIn(Fixtures.superAdmin());

    mvc.perform(get("/admin"))
        .andExpect(status().isOk())
        .andExpect(view().name("admin/overview"))
        .andExpect(model().attribute("section", ConsoleSection.OVERVIEW))
        .andExpect(model().attribute("metrics", metrics))
        .andExpect(model().attributeExists("queue", "recentActions"));

    verify(overview).metrics();
  }

  @Test
  void theLayoutCarriesTheSignedInAdministratorAndTheNavigation() throws Exception {
    var administrator = Fixtures.superAdmin();
    ConsoleMvc.signIn(administrator);

    mvc.perform(get("/admin"))
        .andExpect(model().attribute("administrator", administrator))
        .andExpect(model().attribute("pageTitle", "Console overview"))
        .andExpect(model().attribute("superAdmin", true))
        .andExpect(model().attribute("navigation", ConsoleSection.navigationFor(administrator)))
        .andExpect(model().attribute("language", ConsoleLanguage.EN));
  }

  @Test
  void theSectionTitleIsTranslatedForAMyanmarRequest() throws Exception {
    ConsoleMvc.signIn(Fixtures.superAdmin());

    mvc.perform(get("/admin").locale(ConsoleMvc.MYANMAR))
        .andExpect(model().attribute("pageTitle", "ကွန်ဆိုးလ် အနှစ်ချုပ်"))
        .andExpect(model().attribute("language", ConsoleLanguage.MY));
  }

  @Test
  void aModeratorSeesTheConsoleWithoutSuperAdminPrivileges() throws Exception {
    var moderator = Fixtures.moderator();
    ConsoleMvc.signIn(moderator);

    mvc.perform(get("/admin"))
        .andExpect(status().isOk())
        .andExpect(model().attribute("superAdmin", false))
        .andExpect(model().attribute("navigation", ConsoleSection.navigationFor(moderator)));
  }
}
