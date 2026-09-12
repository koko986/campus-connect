package com.takka.admin.console;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.redirectedUrl;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;

class ConsoleCatalogControllerTest {
  private final MockMvc mvc = ConsoleMvc.forController(new ConsoleCatalogController());

  @Test
  void catalogUrlsReturnToThePresentationConsole() throws Exception {
    mvc.perform(get("/admin/catalog"))
        .andExpect(status().isFound())
        .andExpect(redirectedUrl("/admin"));

    mvc.perform(get("/admin/catalog/programs"))
        .andExpect(status().isFound())
        .andExpect(redirectedUrl("/admin"));
  }

  @Test
  void oldCatalogWritesAreIgnoredAndReturnToTheConsole() throws Exception {
    mvc.perform(post("/admin/catalog/campuses").param("name", "Hlaing Campus"))
        .andExpect(status().isFound())
        .andExpect(redirectedUrl("/admin"));
  }
}
