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
import com.takka.admin.form.CatalogItemForm;
import com.takka.admin.model.AdminIdentity;
import com.takka.admin.model.CatalogResource;
import com.takka.admin.service.CatalogService;
import com.takka.admin.service.UniversityDirectoryService;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.web.servlet.MockMvc;

class ConsoleCatalogControllerTest {
  private final CatalogService catalog = mock(CatalogService.class);
  private final UniversityDirectoryService universities = mock(UniversityDirectoryService.class);
  private final MockMvc mvc = ConsoleMvc.forController(
      new ConsoleCatalogController(catalog, universities, new ConsoleLayout()));

  private final AdminIdentity superAdmin = Fixtures.superAdmin();
  private final UUID universityId = UUID.randomUUID();

  @BeforeEach
  void signIn() {
    ConsoleMvc.signIn(superAdmin);
    when(universities.options()).thenReturn(List.of());
    when(catalog.items(any(), any())).thenReturn(List.of());
    when(catalog.departmentOptions(any())).thenReturn(List.of());
  }

  @AfterEach
  void signOut() {
    ConsoleMvc.signOut();
  }

  @Test
  void theCatalogDefaultsToCampusesWithABlankForm() throws Exception {
    mvc.perform(get("/admin/catalog"))
        .andExpect(status().isOk())
        .andExpect(view().name("admin/catalog"))
        .andExpect(model().attribute("section", ConsoleSection.CATALOG))
        .andExpect(model().attribute("resource", CatalogResource.CAMPUSES))
        .andExpect(model().attributeExists("resources", "universities", "items", "departments", "form"));
  }

  @Test
  void aSelectedUniversityAndResourceReachTheService() throws Exception {
    mvc.perform(get("/admin/catalog").param("resource", "programs").param("universityId", universityId.toString()))
        .andExpect(model().attribute("resource", CatalogResource.PROGRAMS))
        .andExpect(model().attribute("universityId", universityId));

    verify(catalog).items(CatalogResource.PROGRAMS, universityId);
    verify(catalog).departmentOptions(universityId);
  }

  @Test
  void anUnknownResourceIsRejected() throws Exception {
    mvc.perform(get("/admin/catalog").param("resource", "faculties"))
        .andExpect(redirectedUrl("/admin"))
        .andExpect(flash().attribute("flashError", "Unsupported catalog resource: faculties"));
  }

  @Test
  void theEditLinkPrefillsTheFormFromTheService() throws Exception {
    var itemId = UUID.randomUUID();
    var form = new CatalogItemForm();
    form.setName("Hlaing Campus");
    when(catalog.editForm(CatalogResource.CAMPUSES, itemId, universityId)).thenReturn(form);

    mvc.perform(get("/admin/catalog")
            .param("universityId", universityId.toString())
            .param("edit", itemId.toString()))
        .andExpect(model().attribute("form", form));
  }

  @Test
  void savingACampusRedirectsBackToTheSameResourceAndUniversity() throws Exception {
    when(catalog.save(eq(superAdmin), eq(CatalogResource.CAMPUSES), any())).thenReturn("Hlaing Campus");

    mvc.perform(post("/admin/catalog/campuses")
            .param("universityId", universityId.toString())
            .param("name", "Hlaing Campus")
            .param("city", "Yangon"))
        .andExpect(redirectedUrl("/admin/catalog?resource=campuses&universityId=" + universityId))
        .andExpect(flash().attribute("flashSuccess", "Hlaing Campus added to the catalog."));

    var captor = ArgumentCaptor.forClass(CatalogItemForm.class);
    verify(catalog).save(any(), eq(CatalogResource.CAMPUSES), captor.capture());
    assertEquals("Yangon", captor.getValue().getCity());
  }

  @Test
  void savingAnExistingItemReportsAnUpdate() throws Exception {
    when(catalog.save(any(), any(), any())).thenReturn("Hlaing Campus");

    mvc.perform(post("/admin/catalog/campuses")
            .param("id", UUID.randomUUID().toString())
            .param("universityId", universityId.toString())
            .param("name", "Hlaing Campus")
            .param("city", "Yangon"))
        .andExpect(flash().attribute("flashSuccess", "Hlaing Campus updated."));
  }

  @Test
  void aMissingUniversityIsRejectedBeforeTheServiceIsCalled() throws Exception {
    mvc.perform(post("/admin/catalog/departments").param("name", "Computer Science"))
        .andExpect(redirectedUrl("/admin/catalog?resource=departments"))
        .andExpect(flash().attribute("flashError", "Choose a university"));

    verify(catalog, never()).save(any(), any(), any());
  }

  @Test
  void aLatitudeOutsideTheGlobeIsRejected() throws Exception {
    mvc.perform(post("/admin/catalog/campuses")
            .param("universityId", universityId.toString())
            .param("name", "Hlaing Campus")
            .param("city", "Yangon")
            .param("latitude", "120"))
        .andExpect(flash().attribute("flashError", "Latitude must be between -90 and 90"));

    verify(catalog, never()).save(any(), any(), any());
  }

  @Test
  void aModeratorIsRefusedCatalogWrites() throws Exception {
    when(catalog.save(any(), any(), any())).thenThrow(new AccessDeniedException("Super admin access required"));

    mvc.perform(post("/admin/catalog/departments")
            .param("universityId", universityId.toString())
            .param("name", "Computer Science"))
        .andExpect(redirectedUrl("/admin"))
        .andExpect(flash().attribute("flashError", "Super admin access required"));
  }
}
