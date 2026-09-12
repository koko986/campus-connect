package com.takka.admin.console;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.model;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.redirectedUrl;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.view;

import com.takka.admin.Fixtures;
import com.takka.admin.session.AdminSession;
import com.takka.admin.session.AdminSessionService;
import com.takka.admin.session.AdminSignInException;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;

class AdminLoginControllerTest {
  private final AdminSessionService sessions = mock(AdminSessionService.class);
  private final MockMvc mvc = ConsoleMvc.forController(
      new AdminLoginController(sessions, ConsoleMvc.layout(), ConsoleMvc.consoleMessages()));

  @Test
  void loginPageShowsTheTakkaAdminSignInForm() throws Exception {
    when(sessions.read(any())).thenReturn(Optional.empty());

    mvc.perform(get("/admin/login"))
        .andExpect(status().isOk())
        .andExpect(view().name("admin/login"))
        .andExpect(model().attributeExists("form"))
        .andExpect(model().attributeExists("language"))
        .andExpect(model().attributeExists("languageChoices"));
  }

  @Test
  void loginPageReturnsSignedInAdministratorsToTheConsole() throws Exception {
    when(sessions.read(any())).thenReturn(Optional.of(AdminSession.of(Fixtures.superAdmin())));

    mvc.perform(get("/admin/login"))
        .andExpect(status().isFound())
        .andExpect(redirectedUrl("/admin"));
  }

  @Test
  void successfulLoginStartsAnAdminSession() throws Exception {
    var administrator = Fixtures.superAdmin();
    when(sessions.signIn(any())).thenReturn(administrator);

    mvc.perform(post("/admin/login")
            .param("email", "admin@gmail.com")
            .param("password", "123456789"))
        .andExpect(status().isFound())
        .andExpect(redirectedUrl("/admin"));

    verify(sessions).begin(any(HttpServletRequest.class), argThat(identity ->
        identity.userId().equals(administrator.userId()) && identity.role() == administrator.role()));
  }

  @Test
  void refusedLoginReturnsToTheAdminLoginFormWithAnErrorBanner() throws Exception {
    when(sessions.signIn(any())).thenThrow(new AdminSignInException("error.signIn.notAdministrator"));

    mvc.perform(post("/admin/login")
            .param("email", "student@example.com")
            .param("password", "123456789"))
        .andExpect(status().isOk())
        .andExpect(view().name("admin/login"))
        .andExpect(model().attributeExists("form"))
        .andExpect(model().attributeExists("signInError"));
  }
}
