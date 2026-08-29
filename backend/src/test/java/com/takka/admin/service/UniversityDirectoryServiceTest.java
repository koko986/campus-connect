package com.takka.admin.service;

import static com.takka.admin.Fixtures.json;
import static com.takka.admin.Fixtures.moderator;
import static com.takka.admin.Fixtures.superAdmin;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.takka.admin.form.ModerationReasonForm;
import com.takka.admin.form.UniversityForm;
import com.takka.admin.model.ModerationAction;
import com.takka.admin.model.UniversityStateChange;
import com.takka.admin.repository.UniversityRepository;
import com.takka.admin.support.Page;
import com.takka.admin.support.PageRequest;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.access.AccessDeniedException;
import tools.jackson.databind.JsonNode;

class UniversityDirectoryServiceTest {
  private final UniversityRepository universities = mock(UniversityRepository.class);
  private final AuditTrailService auditTrail = mock(AuditTrailService.class);
  private final UniversityDirectoryService service =
      new UniversityDirectoryService(universities, auditTrail);

  private final UUID universityId = UUID.fromString("2b1a0f8e-1111-4a4a-8c1e-9a9a9a9a9a9a");

  private JsonNode stored() {
    return json("{\"id\":\"" + universityId + "\",\"name\":\"Yangon University\",\"is_published\":false}");
  }

  private UniversityForm form() {
    var form = new UniversityForm();
    form.setSlug("yangon-university");
    form.setName("Yangon University");
    form.setShortName("YU");
    form.setCity("Yangon");
    form.setDescription("A public university");
    return form;
  }

  private ModerationReasonForm reason(String text) {
    var moderationReason = new ModerationReasonForm();
    moderationReason.setReason(text);
    return moderationReason;
  }

  @Test
  void creatingAUniversityRequiresSuperAdmin() {
    assertThrows(AccessDeniedException.class, () -> service.create(moderator(), form()));

    verify(universities, never()).insert(any());
  }

  @Test
  void creatingAUniversityAuditsTheNewRow() {
    when(universities.insert(any())).thenReturn(stored());

    var created = service.create(superAdmin(), form());

    assertEquals(universityId, created);
    verify(auditTrail).record(any(), eq(ModerationAction.CREATE_UNIVERSITY), eq(universityId), any(), eq(null), any());
  }

  @Test
  void updatingAUniversityRequiresSuperAdminAndAudits() {
    when(universities.update(eq(universityId), any())).thenReturn(stored());

    assertThrows(AccessDeniedException.class, () -> service.update(moderator(), universityId, form()));

    service.update(superAdmin(), universityId, form());
    verify(auditTrail).record(any(), eq(ModerationAction.UPDATE_UNIVERSITY), eq(universityId), any(), eq(null), any());
  }

  @Test
  void publishingAlsoLiftsAnExistingArchive() {
    when(universities.requireStateById(universityId)).thenReturn(stored());

    service.changeState(superAdmin(), universityId, UniversityStateChange.PUBLISH, reason("Data verified"));

    Map<String, Object> attributes = capturedState();
    assertEquals(true, attributes.get("is_published"));
    assertNull(attributes.get("archived_at"));
    assertNull(attributes.get("archived_by"));
    verify(auditTrail)
        .record(any(), eq(ModerationAction.PUBLISH_UNIVERSITY), eq(universityId), eq("Data verified"), any(), any());
  }

  @Test
  void unpublishingOnlyHidesTheRecord() {
    when(universities.requireStateById(universityId)).thenReturn(stored());

    service.changeState(superAdmin(), universityId, UniversityStateChange.UNPUBLISH, reason("Bad data"));

    Map<String, Object> attributes = capturedState();
    assertEquals(false, attributes.get("is_published"));
    assertTrue(attributes.containsKey("updated_at"));
    assertTrue(!attributes.containsKey("archived_at"));
  }

  @Test
  void archivingHidesTheRecordAndStampsTheAdministrator() {
    var administrator = superAdmin();
    when(universities.requireStateById(universityId)).thenReturn(stored());

    var name = service.changeState(administrator, universityId, UniversityStateChange.ARCHIVE, reason("Closed"));

    Map<String, Object> attributes = capturedState();
    assertEquals("Yangon University", name);
    assertEquals(false, attributes.get("is_published"));
    assertEquals(administrator.userId(), attributes.get("archived_by"));
    assertTrue(attributes.get("archived_at") instanceof String);
  }

  @Test
  void changingVisibilityRequiresSuperAdmin() {
    assertThrows(
        AccessDeniedException.class,
        () -> service.changeState(moderator(), universityId, UniversityStateChange.PUBLISH, reason("Verified")));

    verify(universities, never()).applyState(any(), any());
  }

  @Test
  void theDirectoryIsMappedIntoViewRows() {
    var request = PageRequest.of(0, 25);
    when(universities.findPage(request))
        .thenReturn(new Page<>(
            List.of(json("""
                {"id":"%s","name":"Yangon University","short_name":"YU","slug":"yangon","city":"Yangon",
                 "university_type":"public","is_published":true,"campuses":[{"count":3}]}
                """.formatted(universityId))),
            0,
            25,
            false));

    var page = service.directory(request);

    assertEquals("Published", page.items().get(0).state());
    assertEquals(3, page.items().get(0).campuses());
  }

  @Test
  void selectionOptionsCarryAReadableLabel() {
    when(universities.findAllForSelection())
        .thenReturn(List.of(json("{\"id\":\"" + universityId + "\",\"name\":\"Yangon University\",\"short_name\":\"YU\"}")));

    assertEquals("Yangon University (YU)", service.options().get(0).label());
  }

  @Test
  void countsComeFromTheRepository() {
    when(universities.countAll()).thenReturn(40L);
    when(universities.countPublished()).thenReturn(31L);

    assertEquals(40L, service.totalUniversities());
    assertEquals(31L, service.publishedUniversities());
  }

  @SuppressWarnings("unchecked")
  private Map<String, Object> capturedState() {
    var captor = ArgumentCaptor.forClass(Map.class);
    verify(universities).applyState(eq(universityId), captor.capture());
    return captor.getValue();
  }
}
