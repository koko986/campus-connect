package com.takka.admin.console;

import com.takka.admin.model.AdminIdentity;
import com.takka.admin.service.AdminNotificationService;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

/** Opens an admin notification and sends the administrator to the relevant queue item. */
@Controller
@RequestMapping("/admin/notifications")
public class ConsoleNotificationsController {
  private final AdminNotificationService notifications;

  public ConsoleNotificationsController(AdminNotificationService notifications) {
    this.notifications = notifications;
  }

  @GetMapping("/{id}/open")
  String open(@AuthenticationPrincipal AdminIdentity administrator, @PathVariable UUID id) {
    return "redirect:" + notifications.open(administrator, id);
  }
}
