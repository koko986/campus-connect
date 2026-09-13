package com.takka.admin.model;

import java.util.List;

/** Topbar notification state for the signed-in administrator. */
public record AdminNotifications(long unreadCount, List<AdminNotificationView> recent) {
  public AdminNotifications {
    recent = List.copyOf(recent);
  }

  public static AdminNotifications empty() {
    return new AdminNotifications(0, List.of());
  }

  public boolean hasUnread() {
    return unreadCount > 0;
  }

  public boolean hasRecent() {
    return !recent.isEmpty();
  }
}
