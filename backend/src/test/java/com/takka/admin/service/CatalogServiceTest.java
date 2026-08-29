package com.takka.admin.service;

import static com.takka.admin.Fixtures.json;
import static com.takka.admin.Fixtures.moderator;
import static com.takka.admin.Fixtures.superAdmin;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.takka.admin.form.CatalogItemForm;
import com.takka.admin.model.CatalogResource;
import com.takka.admin.repository.CatalogRepository;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.access.AccessDeniedException;

class CatalogServiceTest {
  private final CatalogRepository repository = mock(CatalogRepository.class);
  private final CatalogService service = new CatalogService(repository);

  private final UUID universityId = UUID.randomUUID();
  private final UUID itemId = UUID.randomUUID();

  private CatalogItemForm campusForm(String city) {
    var form = new CatalogItemForm();
    form.setUniversityId(universityId);
    form.setName("Main campus");
    form.setCity(city);
    return form;
  }

  @Test
  void withoutAUniversityNothingIsQueried() {
    assertTrue(service.items(CatalogResource.CAMPUSES, null).isEmpty());
    assertTrue(service.departmentOptions(null).isEmpty());
    verify(repository, never()).findAll(any(), any());
  }

  @Test
  void itemsAreMappedForTheChosenResource() {
    when(repository.findAll(CatalogResource.DEPARTMENTS, universityId))
        .thenReturn(List.of(json("{\"id\":\"" + itemId + "\",\"name\":\"Engineering\"}")));

    var items = service.items(CatalogResource.DEPARTMENTS, universityId);

    assertEquals(1, items.size());
    assertEquals("Engineering", items.get(0).name());
    assertEquals(CatalogResource.DEPARTMENTS, items.get(0).resource());
  }

  @Test
  void savingRequiresSuperAdmin() {
    assertThrows(
        AccessDeniedException.class,
        () -> service.save(moderator(), CatalogResource.CAMPUSES, campusForm("Yangon")));

    verify(repository, never()).insert(any(), any());
  }

  @Test
  void aCampusWithoutACityIsRejectedBecauseTheColumnIsNotNullable() {
    var error = assertThrows(
        IllegalArgumentException.class,
        () -> service.save(superAdmin(), CatalogResource.CAMPUSES, campusForm("  ")));

    assertEquals("A city is required for a campus", error.getMessage());
    verify(repository, never()).insert(any(), any());
  }

  @Test
  void aDepartmentDoesNotNeedACity() {
    var form = new CatalogItemForm();
    form.setUniversityId(universityId);
    form.setName("Engineering");

    var name = service.save(superAdmin(), CatalogResource.DEPARTMENTS, form);

    assertEquals("Engineering", name);
    verify(repository).insert(eq(CatalogResource.DEPARTMENTS), any());
  }

  @Test
  void aFormWithAnIdUpdatesInsteadOfInserting() {
    var form = campusForm("Yangon");
    form.setId(itemId);

    service.save(superAdmin(), CatalogResource.CAMPUSES, form);

    verify(repository).update(eq(CatalogResource.CAMPUSES), eq(itemId), any());
    verify(repository, never()).insert(any(), any());
  }

  @Test
  void campusAttributesCarryTheLocationColumns() {
    var form = campusForm("Yangon");
    form.setAddress("1 University Road");
    form.setLatitude(16.8);
    form.setLongitude(96.1);

    service.save(superAdmin(), CatalogResource.CAMPUSES, form);

    Map<String, Object> attributes = capturedInsert(CatalogResource.CAMPUSES);
    assertEquals("Yangon", attributes.get("city"));
    assertEquals("1 University Road", attributes.get("address"));
    assertEquals(16.8, attributes.get("latitude"));
    assertEquals(universityId, attributes.get("university_id"));
  }

  @Test
  void programAttributesCarryTheDegreeAndDepartment() {
    var departmentId = UUID.randomUUID();
    var form = new CatalogItemForm();
    form.setUniversityId(universityId);
    form.setName("Computer Science");
    form.setDegreeLevel("Bachelor");
    form.setDepartmentId(departmentId);
    form.setCity("ignored for programs");

    service.save(superAdmin(), CatalogResource.PROGRAMS, form);

    Map<String, Object> attributes = capturedInsert(CatalogResource.PROGRAMS);
    assertEquals("Bachelor", attributes.get("degree_level"));
    assertEquals(departmentId, attributes.get("department_id"));
    assertTrue(!attributes.containsKey("city"));
  }

  @Test
  void blankOptionalFieldsBecomeNullRatherThanEmptyStrings() {
    var form = campusForm("Yangon");

    service.save(superAdmin(), CatalogResource.CAMPUSES, form);

    Map<String, Object> attributes = capturedInsert(CatalogResource.CAMPUSES);
    assertTrue(attributes.containsKey("source_url"));
    assertEquals(null, attributes.get("source_url"));
  }

  @Test
  void editingAnUnknownItemFails() {
    when(repository.findById(CatalogResource.PROGRAMS, itemId)).thenReturn(Optional.empty());

    var error = assertThrows(
        IllegalArgumentException.class,
        () -> service.editForm(CatalogResource.PROGRAMS, itemId, universityId));

    assertEquals("Program not found", error.getMessage());
  }

  @Test
  void theEditFormIsPrefilledFromTheStoredRow() {
    when(repository.findById(CatalogResource.CAMPUSES, itemId))
        .thenReturn(Optional.of(json("""
            {"id":"%s","name":"Main campus","city":"Yangon","address":"1 Road",
             "latitude":16.8,"longitude":96.1,"source_url":"https://yu.edu.mm"}
            """.formatted(itemId))));

    var form = service.editForm(CatalogResource.CAMPUSES, itemId, universityId);

    assertTrue(form.isEditing());
    assertEquals("Main campus", form.getName());
    assertEquals("Yangon", form.getCity());
    assertEquals(16.8, form.getLatitude());
    assertEquals(universityId, form.getUniversityId());
  }

  @SuppressWarnings("unchecked")
  private Map<String, Object> capturedInsert(CatalogResource resource) {
    var captor = ArgumentCaptor.forClass(Map.class);
    verify(repository).insert(eq(resource), captor.capture());
    return captor.getValue();
  }
}
