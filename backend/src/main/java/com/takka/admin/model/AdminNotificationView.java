package com.takka.admin.model;

import java.util.UUID;

/** A recent queue notification shown in the admin console topbar. */
public record AdminNotificationView(
    UUID id,
    String body,
    String entityType,
    UUID entityId,
    String created,
    boolean unread,
    String href) {

  public boolean hasHref() {
    return href != null && !href.isBlank();
  }
}
