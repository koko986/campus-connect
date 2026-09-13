package com.takka.admin.service;

import com.takka.admin.model.AdminIdentity;
import com.takka.admin.model.AdminNotificationView;
import com.takka.admin.model.AdminNotifications;
import com.takka.admin.repository.AdminNotificationRepository;
import com.takka.admin.support.Json;
import com.takka.admin.support.Timestamps;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import tools.jackson.databind.JsonNode;

/** Topbar notifications for admin review work. */
@Service
public class AdminNotificationService {
  private static final int TOPBAR_LIMIT = 6;

  private final AdminNotificationRepository notifications;

  public AdminNotificationService(AdminNotificationRepository notifications) {
    this.notifications = notifications;
  }

  public AdminNotifications topbar(AdminIdentity administrator) {
    if (administrator == null) return AdminNotifications.empty();
    List<AdminNotificationView> recent = notifications.recent(administrator.userId(), TOPBAR_LIMIT).stream()
        .map(AdminNotificationService::toView)
        .toList();
    return new AdminNotifications(notifications.unreadCount(administrator.userId()), recent);
  }

  public void markRead(AdminIdentity administrator, UUID notificationId) {
    AdminAccess.requireAdministrator(administrator);
    notifications.markRead(notificationId, administrator.userId());
  }

  public String open(AdminIdentity administrator, UUID notificationId) {
    AdminAccess.requireAdministrator(administrator);
    String href = notifications.findForUser(notificationId, administrator.userId())
        .map(AdminNotificationService::toView)
        .map(AdminNotificationView::href)
        .orElse("/admin");
    notifications.markRead(notificationId, administrator.userId());
    return href;
  }

  private static AdminNotificationView toView(JsonNode row) {
    String entityType = Json.text(row, "entity_type");
    UUID entityId = Json.optionalUuid(row, "entity_id").orElse(null);
    return new AdminNotificationView(
        Json.uuid(row, "id"),
        Json.text(row, "body", "New admin review item."),
        entityType,
        entityId,
        Timestamps.format(Json.optionalInstant(row, "created_at")),
        Json.optionalText(row, "read_at").isEmpty(),
        hrefFor(entityType, entityId));
  }

  private static String hrefFor(String entityType, UUID entityId) {
    if (entityId == null) return "/admin";
    return switch (entityType == null ? "" : entityType) {
      case "report" -> "/admin/reports?highlight=" + entityId;
      case "opportunity" -> "/admin/opportunities?highlight=" + entityId;
      case "student_verification" -> "/admin/members?highlight=" + entityId;
      case "post" -> "/admin/posts?highlight=" + entityId;
      default -> "/admin";
    };
  }
}
