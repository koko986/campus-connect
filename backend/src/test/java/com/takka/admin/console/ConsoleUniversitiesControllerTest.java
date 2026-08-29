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
import com.takka.admin.form.UniversityForm;
import com.takka.admin.model.AdminIdentity;
import com.takka.admin.model.UniversityStateChange;
import com.takka.admin.service.UniversityDirectoryService;
import com.takka.admin.support.Page;
import com.takka.admin.support.PageRequest;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

class ConsoleUniversitiesControllerTest {
  private final UniversityDirectoryService universities = mock(UniversityDirectoryService.class);
  private final MockMvc mvc = ConsoleMvc.forController(
      new ConsoleUniversitiesController(universities, ConsoleMvc.layout(), ConsoleMvc.consoleMessages()));

  private final AdminIdentity superAdmin = Fixtures.superAdmin();
  private final UUID universityId = UUID.randomUUID();

  @BeforeEach
  void signIn() {
    ConsoleMvc.signIn(superAdmin);
    when(universities.directory(any())).thenReturn(Page.empty(PageRequest.of(0)));
  }

  @AfterEach
  void signOut() {
    ConsoleMvc.signOut();
  }

  /** A complete directory record, with the two fields each test needs to vary passed in. */
  private MockHttpServletRequestBuilder universityForm(
      MockHttpServletRequestBuilder request, String slug, String description) {
    return request
        .param("slug", slug)
        .param("name", "Yangon University")
        .param("shortName", "YU")
        .param("universityType", "public")
        .param("city", "Yangon")
        .param("countryCode", "MM")
        .param("description", description);
  }

  private MockHttpServletRequestBuilder validUniversity(MockHttpServletRequestBuilder request) {
    return universityForm(request, "yangon-university", "A public university in Yangon");
  }

  @Test
  void theDirectoryRendersWithTheConsoleShellAttributes() throws Exception {
    mvc.perform(get("/admin/universities"))
        .andExpect(status().isOk())
        .andExpect(view().name("admin/universities"))
        .andExpect(model().attribute("section", ConsoleSection.UNIVERSITIES))
        .andExpect(model().attributeExists("universities", "stateChanges"));
  }

  @Test
  void theCreateFormStartsBlank() throws Exception {
    mvc.perform(get("/admin/universities/new"))
        .andExpect(view().name("admin/university-form"))
        .andExpect(model().attribute("editing", false))
        .andExpect(model().attributeExists("form", "types"));
  }

  @Test
  void theEditFormIsPrefilledFromTheService() throws Exception {
    var form = new UniversityForm();
    form.setName("Yangon University");
    when(universities.editForm(universityId)).thenReturn(form);

    mvc.perform(get("/admin/universities/{id}/edit", universityId))
        .andExpect(view().name("admin/university-form"))
        .andExpect(model().attribute("editing", true))
        .andExpect(model().attribute("universityId", universityId))
        .andExpect(model().attribute("form", form));
  }

  @Test
  void creatingAUniversityRedirectsToTheDirectory() throws Exception {
    mvc.perform(validUniversity(post("/admin/universities")))
        .andExpect(redirectedUrl("/admin/universities"))
        .andExpect(flash().attribute("flashSuccess", "Yangon University added to the directory."));

    var captor = ArgumentCaptor.forClass(UniversityForm.class);
    verify(universities).create(eq(superAdmin), captor.capture());
    assertEquals("yangon-university", captor.getValue().getSlug());
  }

  @Test
  void anInvalidSlugRedisplaysTheFormWithFieldErrors() throws Exception {
    mvc.perform(universityForm(post("/admin/universities"), "Yangon University!", "A public university"))
        .andExpect(status().isOk())
        .andExpect(view().name("admin/university-form"))
        .andExpect(model().attributeHasFieldErrors("form", "slug"));

    verify(universities, never()).create(any(), any());
  }

  @Test
  void aMissingDescriptionRedisplaysTheEditFormForTheSameRecord() throws Exception {
    mvc.perform(universityForm(post("/admin/universities/{id}", universityId), "yangon-university", ""))
        .andExpect(view().name("admin/university-form"))
        .andExpect(model().attribute("editing", true))
        .andExpect(model().attribute("universityId", universityId))
        .andExpect(model().attributeHasFieldErrors("form", "description"));

    verify(universities, never()).update(any(), any(), any());
  }

  @Test
  void updatingAUniversityRedirectsToTheDirectory() throws Exception {
    mvc.perform(validUniversity(post("/admin/universities/{id}", universityId)))
        .andExpect(redirectedUrl("/admin/universities"))
        .andExpect(flash().attribute("flashSuccess", "Yangon University updated."));

    verify(universities).update(eq(superAdmin), eq(universityId), any());
  }

  @Test
  void publishingReportsThePastTenseStateInTheFlash() throws Exception {
    when(universities.changeState(any(), eq(universityId), eq(UniversityStateChange.PUBLISH), any()))
        .thenReturn("Yangon University");

    mvc.perform(post("/admin/universities/{id}/state/publish", universityId).param("reason", "Data verified"))
        .andExpect(redirectedUrl("/admin/universities"))
        .andExpect(flash().attribute("flashSuccess", "Yangon University is now published."));
  }

  @Test
  void archivingReportsThePastTenseStateInTheFlash() throws Exception {
    when(universities.changeState(any(), eq(universityId), eq(UniversityStateChange.ARCHIVE), any()))
        .thenReturn("Yangon University");

    mvc.perform(post("/admin/universities/{id}/state/archive", universityId).param("reason", "Campus closed"))
        .andExpect(flash().attribute("flashSuccess", "Yangon University is now archived."));
  }

  @Test
  void anUnknownStateChangeIsRejected() throws Exception {
    mvc.perform(post("/admin/universities/{id}/state/destroy", universityId).param("reason", "Because"))
        .andExpect(redirectedUrl("/admin"))
        .andExpect(flash().attribute("flashError", "Unknown university operation: destroy"));

    verify(universities, never()).changeState(any(), any(), any(), any());
  }

  @Test
  void aStateChangeWithoutAReasonIsRejected() throws Exception {
    mvc.perform(post("/admin/universities/{id}/state/publish", universityId).param("reason", ""))
        .andExpect(redirectedUrl("/admin/universities"))
        .andExpect(flash().attributeExists("flashError"));

    verify(universities, never()).changeState(any(), any(), any(), any());
  }

  @Test
  void aModeratorIsRefusedDirectoryWrites() throws Exception {
    when(universities.changeState(any(), any(), any(), any()))
        .thenThrow(new AccessDeniedException("error.access.superAdmin"));

    mvc.perform(post("/admin/universities/{id}/state/publish", universityId).param("reason", "Data verified"))
        .andExpect(redirectedUrl("/admin"))
        .andExpect(flash().attribute("flashError", "That action is limited to super admins."));
  }

  /** The unknown-operation message takes the attempted slug as an argument in either language. */
  @Test
  void anUnknownStateChangeIsReportedInTheRequestedLanguage() throws Exception {
    mvc.perform(post("/admin/universities/{id}/state/destroy", universityId)
            .param("reason", "Because")
            .locale(ConsoleMvc.MYANMAR))
        .andExpect(flash().attribute("flashError", "မသိရသော တက္ကသိုလ် လုပ်ဆောင်ချက်: destroy"));
  }
}
