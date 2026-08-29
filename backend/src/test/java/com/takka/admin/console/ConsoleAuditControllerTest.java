package com.takka.admin.console;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.model;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.view;

import com.takka.admin.Fixtures;
import com.takka.admin.service.AuditTrailService;
import com.takka.admin.support.Page;
import com.takka.admin.support.PageRequest;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.test.web.servlet.MockMvc;

class ConsoleAuditControllerTest {
  private final AuditTrailService auditTrail = mock(AuditTrailService.class);
  private final MockMvc mvc = ConsoleMvc.forController(new ConsoleAuditController(auditTrail, new ConsoleLayout()));

  @BeforeEach
  void signIn() {
    ConsoleMvc.signIn(Fixtures.moderator());
    when(auditTrail.entries(any())).thenReturn(Page.empty(PageRequest.of(0)));
  }

  @AfterEach
  void signOut() {
    ConsoleMvc.signOut();
  }

  @Test
  void theAuditLogRendersForBothRoles() throws Exception {
    mvc.perform(get("/admin/audit"))
        .andExpect(status().isOk())
        .andExpect(view().name("admin/audit"))
        .andExpect(model().attribute("section", ConsoleSection.AUDIT))
        .andExpect(model().attributeExists("entries"));
  }

  @Test
  void theRequestedPageReachesTheServiceWithTheConsolePageSize() throws Exception {
    mvc.perform(get("/admin/audit").param("page", "3")).andExpect(status().isOk());

    var captor = ArgumentCaptor.forClass(PageRequest.class);
    verify(auditTrail).entries(captor.capture());
    assertEquals(3, captor.getValue().page());
    assertEquals(50, captor.getValue().size());
  }

  @Test
  void aNegativePageIsClampedRatherThanFailing() throws Exception {
    mvc.perform(get("/admin/audit").param("page", "-7")).andExpect(status().isOk());

    var captor = ArgumentCaptor.forClass(PageRequest.class);
    verify(auditTrail).entries(captor.capture());
    assertEquals(0, captor.getValue().page());
  }
}
