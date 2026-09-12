package com.takka.admin.console;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.doThrow;
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
import com.takka.admin.service.OpportunityModerationService;
import com.takka.admin.support.Page;
import com.takka.admin.support.PageRequest;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;

class ConsoleOpportunitiesControllerTest {
  private final OpportunityModerationService opportunities = mock(OpportunityModerationService.class);
  private final MockMvc mvc = ConsoleMvc.forController(
      new ConsoleOpportunitiesController(opportunities, ConsoleMvc.layout(), ConsoleMvc.consoleMessages()));

  private final AdminIdentity administrator = Fixtures.moderator();
  private final UUID opportunityId = UUID.randomUUID();

  @BeforeEach
  void signIn() {
    ConsoleMvc.signIn(administrator);
    when(opportunities.queue(any(), any())).thenReturn(Page.empty(PageRequest.of(0)));
    when(opportunities.statusCounts()).thenReturn(Map.of("pending", 1L));
  }

  @AfterEach
  void signOut() {
    ConsoleMvc.signOut();
  }

  @Test
  void theOpportunityPageRendersWithTheConsoleShellAttributes() throws Exception {
    mvc.perform(get("/admin/opportunities"))
        .andExpect(status().isOk())
        .andExpect(view().name("admin/opportunities"))
        .andExpect(model().attribute("section", ConsoleSection.OPPORTUNITIES))
        .andExpect(model().attributeExists("opportunities", "counts", "statuses", "statusFilter"));
  }

  @Test
  void approvingAnOpportunityCallsTheModerationService() throws Exception {
    mvc.perform(post("/admin/opportunities/{id}/decision", opportunityId)
            .param("decision", "published")
            .param("note", "Source checked")
            .param("returnStatus", "pending"))
        .andExpect(redirectedUrl("/admin/opportunities?status=pending"))
        .andExpect(flash().attribute("flashSuccess", "Opportunity approved and published."));

    verify(opportunities).decide(administrator, opportunityId, "published", "Source checked");
  }

  @Test
  void rejectingAnOpportunityCallsTheModerationService() throws Exception {
    mvc.perform(post("/admin/opportunities/{id}/decision", opportunityId)
            .param("decision", "rejected")
            .param("note", "Not enough information")
            .param("returnStatus", "all"))
        .andExpect(redirectedUrl("/admin/opportunities?status=all"))
        .andExpect(flash().attribute("flashSuccess", "Opportunity rejected. The submitting student has been notified."));

    verify(opportunities).decide(administrator, opportunityId, "rejected", "Not enough information");
  }

  @Test
  void invalidOpportunityDecisionsAreRejectedBeforeTheServiceIsCalled() throws Exception {
    mvc.perform(post("/admin/opportunities/{id}/decision", opportunityId)
            .param("decision", "archived")
            .param("note", "Later"))
        .andExpect(redirectedUrl("/admin/opportunities?status=pending"))
        .andExpect(flash().attributeExists("flashError"));

    verify(opportunities, never()).decide(any(), any(), any(), any());
  }

  @Test
  void opportunityActionFailuresReturnToTheListWithAConsoleError() throws Exception {
    doThrow(new IllegalStateException("supabase unavailable")).when(opportunities).decide(any(), any(), any(), any());

    mvc.perform(post("/admin/opportunities/{id}/decision", opportunityId)
            .param("decision", "published")
            .param("note", "Source checked"))
        .andExpect(redirectedUrl("/admin/opportunities?status=pending"))
        .andExpect(flash().attribute(
            "flashError", "The opportunity action could not be completed right now. Try again in a moment."));
  }

  @Test
  void opportunityPageStaysOpenWhenTheQueueCannotLoad() throws Exception {
    when(opportunities.queue(any(), any())).thenThrow(new IllegalStateException("queue unavailable"));

    mvc.perform(get("/admin/opportunities"))
        .andExpect(status().isOk())
        .andExpect(view().name("admin/opportunities"))
        .andExpect(model().attributeExists("opportunities", "counts", "flashError"));
  }

  @Test
  void opportunityPageStaysOpenWhenCountsCannotLoad() throws Exception {
    when(opportunities.statusCounts()).thenThrow(new IllegalStateException("counts unavailable"));

    mvc.perform(get("/admin/opportunities"))
        .andExpect(status().isOk())
        .andExpect(view().name("admin/opportunities"))
        .andExpect(model().attributeExists("opportunities", "counts", "flashError"));
  }
}
