package com.takka.admin.console;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.redirectedUrl;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;

class ConsoleAuditControllerTest {
  private final MockMvc mvc = ConsoleMvc.forController(new ConsoleAuditController());

  @Test
  void auditUrlsReturnToThePresentationConsole() throws Exception {
    mvc.perform(get("/admin/audit"))
        .andExpect(status().isFound())
        .andExpect(redirectedUrl("/admin"));

    mvc.perform(get("/admin/audit?page=3"))
        .andExpect(status().isFound())
        .andExpect(redirectedUrl("/admin"));
  }
}
