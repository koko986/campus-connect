package com.takka.admin.console;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.redirectedUrl;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.takka.admin.Fixtures;
import com.takka.admin.model.AdminIdentity;
import com.takka.admin.model.AdminRole;
import com.takka.admin.session.AdminSession;
import com.takka.admin.session.AdminSessionService;
import com.takka.config.SecurityConfig;
import com.takka.security.TakkaPrincipal;
import com.takka.supabase.SupabaseGateway;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.context.support.PropertySourcesPlaceholderConfigurer;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.test.context.web.WebAppConfiguration;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;

/**
 * Exercises the real {@link SecurityConfig} rather than a controller: the console chain redirects
 * anonymous visitors to its own login page and demands a CSRF token on writes, while the API chain
 * stays stateless, token-authenticated, and free of both.
 *
 * <p>Stand-in endpoints are used so the test states security behaviour independently of any
 * particular console page.
 */
@ExtendWith(SpringExtension.class)
@ContextConfiguration(classes = ConsoleSecurityTest.TestConfig.class)
@WebAppConfiguration
@TestPropertySource(properties = "takka.frontend-origin=http://localhost:5173")
class ConsoleSecurityTest {
  @Autowired private WebApplicationContext context;
  @Autowired private AdminSessionService sessions;
  @Autowired private SupabaseGateway supabase;

  private MockMvc mvc;
  private final AdminIdentity administrator = Fixtures.superAdmin();

  @BeforeEach
  void setUp() {
    reset(sessions);
    reset(supabase);
    mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
  }

  private void withConsoleSession(AdminRole role) {
    var session = new AdminSession(administrator.userId(), administrator.email(), role, Instant.now());
    when(sessions.read(any())).thenReturn(Optional.of(session));
    when(sessions.currentRole(session)).thenReturn(Optional.of(role));
  }

  @Test
  void anAnonymousConsoleRequestIsSentToTheConsoleLoginPage() throws Exception {
    mvc.perform(get("/admin/reports"))
        .andExpect(status().isFound())
        .andExpect(redirectedUrl("/admin/login"));
  }

  @Test
  void theLoginPageIsReachableWithoutASession() throws Exception {
    mvc.perform(get("/admin/login")).andExpect(status().isOk());
  }

  @Test
  void anAdministratorSessionReachesTheConsoleAsTheAuthenticatedPrincipal() throws Exception {
    withConsoleSession(AdminRole.SUPER_ADMIN);

    mvc.perform(get("/admin/reports"))
        .andExpect(status().isOk())
        .andExpect(content().string(administrator.email()));
  }

  @Test
  void aRevokedAdministratorLosesAccessOnTheNextRequest() throws Exception {
    var session = AdminSession.of(administrator);
    when(sessions.read(any())).thenReturn(Optional.of(session));
    when(sessions.currentRole(session)).thenReturn(Optional.empty());

    mvc.perform(get("/admin/reports")).andExpect(redirectedUrl("/admin/login"));

    verify(sessions).end(any());
  }

  @Test
  void aConsoleWriteWithoutACsrfTokenIsRejected() throws Exception {
    withConsoleSession(AdminRole.SUPER_ADMIN);

    mvc.perform(post("/admin/reports/decide")).andExpect(status().isForbidden());
  }

  @Test
  void aConsoleWriteWithACsrfTokenIsAccepted() throws Exception {
    withConsoleSession(AdminRole.SUPER_ADMIN);

    mvc.perform(post("/admin/reports/decide").with(csrf()))
        .andExpect(status().isOk())
        .andExpect(content().string("decided"));
  }

  @Test
  void aModeratorSessionAlsoReachesTheConsole() throws Exception {
    withConsoleSession(AdminRole.MODERATOR);

    mvc.perform(post("/admin/reports/decide").with(csrf())).andExpect(status().isOk());
  }

  @Test
  void anApiRequestWithoutATokenIsRefusedWithoutARedirect() throws Exception {
    mvc.perform(get("/api/probe"))
        .andExpect(status().is4xxClientError())
        .andExpect(header().doesNotExist("Location"));
  }

  @Test
  void anApiWriteNeedsABearerTokenButNoCsrfToken() throws Exception {
    when(supabase.authenticate("token-123"))
        .thenReturn(new TakkaPrincipal(UUID.randomUUID(), "member@takka.test", "token-123"));

    mvc.perform(post("/api/probe").header("Authorization", "Bearer token-123"))
        .andExpect(status().isOk())
        .andExpect(content().string("member@takka.test"));
  }

  @Configuration
  @EnableWebMvc
  @EnableWebSecurity
  @Import(SecurityConfig.class)
  static class TestConfig {
    @Bean
    static PropertySourcesPlaceholderConfigurer placeholders() {
      return new PropertySourcesPlaceholderConfigurer();
    }

    @Bean
    AdminSessionService sessions() {
      return mock(AdminSessionService.class);
    }

    @Bean
    SupabaseGateway supabase() {
      return mock(SupabaseGateway.class);
    }

    @Bean
    Endpoints endpoints() {
      return new Endpoints();
    }
  }

  @RestController
  static class Endpoints {
    @GetMapping("/admin/login")
    String loginPage() {
      return "login";
    }

    @GetMapping("/admin/reports")
    String reports(@AuthenticationPrincipal AdminIdentity administrator) {
      return administrator.email();
    }

    @PostMapping("/admin/reports/decide")
    String decide() {
      return "decided";
    }

    @GetMapping("/api/probe")
    String probe(@AuthenticationPrincipal TakkaPrincipal principal) {
      return principal.email();
    }

    @PostMapping("/api/probe")
    String probeWrite(@AuthenticationPrincipal TakkaPrincipal principal) {
      return principal.email();
    }
  }
}
