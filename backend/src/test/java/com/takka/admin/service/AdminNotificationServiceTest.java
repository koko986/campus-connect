package com.takka.admin.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.takka.admin.Fixtures;
import com.takka.admin.repository.AdminNotificationRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class AdminNotificationServiceTest {
  private final AdminNotificationRepository repository = mock(AdminNotificationRepository.class);
  private final AdminNotificationService service = new AdminNotificationService(repository);

  @Test
  void topbarMapsRecentAdminNotificationsToQueueLinks() {
    var admin = Fixtures.superAdmin();
    UUID notificationId = UUID.randomUUID();
    UUID reportId = UUID.randomUUID();
    when(repository.recent(admin.userId(), 6)).thenReturn(List.of(Fixtures.json("""
      {
        "id": "%s",
        "body": "New post report awaiting review.",
        "entity_type": "report",
        "entity_id": "%s",
        "read_at": null,
        "created_at": "2026-09-13T10:00:00Z"
      }
      """.formatted(notificationId, reportId))));
    when(repository.unreadCount(admin.userId())).thenReturn(1L);

    var state = service.topbar(admin);

    assertEquals(1L, state.unreadCount());
    assertTrue(state.hasRecent());
    assertEquals("/admin/reports?highlight=" + reportId, state.recent().get(0).href());
    assertTrue(state.recent().get(0).unread());
  }

  @Test
  void openingANotificationMarksItReadAndReturnsTheDestination() {
    var admin = Fixtures.superAdmin();
    UUID notificationId = UUID.randomUUID();
    UUID opportunityId = UUID.randomUUID();
    when(repository.findForUser(notificationId, admin.userId())).thenReturn(Optional.of(Fixtures.json("""
      {
        "id": "%s",
        "body": "New opportunity awaiting review.",
        "entity_type": "opportunity",
        "entity_id": "%s",
        "read_at": null,
        "created_at": "2026-09-13T10:00:00Z"
      }
      """.formatted(notificationId, opportunityId))));

    assertEquals("/admin/opportunities?highlight=" + opportunityId, service.open(admin, notificationId));
    verify(repository).markRead(notificationId, admin.userId());
  }
}
