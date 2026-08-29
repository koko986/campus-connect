package com.takka;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.takka.admin.console.ConsoleAuditController;
import com.takka.admin.console.ConsoleCatalogController;
import com.takka.admin.console.ConsoleMembersController;
import com.takka.admin.console.ConsoleOverviewController;
import com.takka.admin.console.ConsolePostsController;
import com.takka.admin.console.ConsoleReportsController;
import com.takka.admin.console.ConsoleUniversitiesController;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.core.io.ClassPathResource;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

/**
 * Boots the whole application once. Sliced tests cannot catch a wiring mistake that only appears
 * when every bean is present, and the console adds a second security chain plus a template engine
 * to a context that previously served JSON alone.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
class ApplicationContextTest {
  @Autowired private ApplicationContext context;
  @Autowired private List<SecurityFilterChain> chains;

  // Named explicitly: actuator contributes a second mapping of the same type.
  @Autowired
  @Qualifier("requestMappingHandlerMapping")
  private RequestMappingHandlerMapping handlerMapping;

  @Test
  void theConsoleAndTheApiEachGetTheirOwnSecurityChain() {
    assertEquals(2, chains.size());
  }

  @Test
  void everyConsolePageHasAController() {
    assertNotNull(context.getBean(ConsoleOverviewController.class));
    assertNotNull(context.getBean(ConsoleReportsController.class));
    assertNotNull(context.getBean(ConsoleMembersController.class));
    assertNotNull(context.getBean(ConsolePostsController.class));
    assertNotNull(context.getBean(ConsoleUniversitiesController.class));
    assertNotNull(context.getBean(ConsoleCatalogController.class));
    assertNotNull(context.getBean(ConsoleAuditController.class));
  }

  @Test
  void theRemovedAdminApiIsNoLongerMapped() {
    boolean mapped = handlerMapping.getHandlerMethods().keySet().stream()
        .flatMap(info -> info.getPatternValues().stream())
        .anyMatch(pattern -> pattern.startsWith("/api/admin"));
    assertFalse(mapped, "The console calls services directly, so /api/admin/** must be gone");
  }

  @Test
  void theMemberFacingApiIsStillMapped() {
    var patterns = handlerMapping.getHandlerMethods().keySet().stream()
        .flatMap(info -> info.getPatternValues().stream())
        .toList();
    assertTrue(patterns.contains("/api/reports"), "Reporting is still served to the React app");
    assertTrue(patterns.contains("/api/account/status"));
  }

  @Test
  void everyConsoleTemplateAndTheStylesheetArePackaged() {
    for (String template : List.of(
        "fragments", "login", "overview", "reports", "members", "posts", "universities",
        "university-form", "catalog", "audit", "error")) {
      assertTrue(
          new ClassPathResource("templates/admin/" + template + ".html").exists(),
          "Missing console template: " + template);
    }
    assertTrue(new ClassPathResource("static/admin/assets/console.css").exists());
  }
}
