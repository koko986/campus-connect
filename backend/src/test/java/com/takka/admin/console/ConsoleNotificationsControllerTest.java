package com.takka.admin.console;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.redirectedUrl;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.takka.admin.Fixtures;
import com.takka.admin.service.AdminNotificationService;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;

class ConsoleNotificationsControllerTest {
  private final AdminNotificationService notifications = mock(AdminNotificationService.class);
  private final MockMvc mvc = ConsoleMvc.forController(new ConsoleNotificationsController(notifications));
  private final UUID notificationId = UUID.randomUUID();

  @BeforeEach
  void signIn() {
    ConsoleMvc.signIn(Fixtures.superAdmin());
  }

  @AfterEach
  void signOut() {
    ConsoleMvc.signOut();
  }

  @Test
  void openingANotificationRedirectsToTheResolvedAdminDestination() throws Exception {
    UUID reportId = UUID.randomUUID();
    when(notifications.open(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.eq(notificationId)))
        .thenReturn("/admin/reports?highlight=" + reportId);

    mvc.perform(get("/admin/notifications/{id}/open", notificationId))
        .andExpect(status().is3xxRedirection())
        .andExpect(redirectedUrl("/admin/reports?highlight=" + reportId));
  }
}
