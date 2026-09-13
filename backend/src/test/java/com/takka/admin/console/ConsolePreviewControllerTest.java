package com.takka.admin.console;

import static com.takka.admin.Fixtures.json;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.model;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.view;

import com.takka.admin.Fixtures;
import com.takka.admin.model.AdminIdentity;
import com.takka.admin.model.AdminPreviewView;
import com.takka.admin.repository.PostRepository;
import com.takka.admin.repository.ProfileRepository;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;

class ConsolePreviewControllerTest {
  private final PostRepository posts = mock(PostRepository.class);
  private final ProfileRepository profiles = mock(ProfileRepository.class);
  private final MockMvc mvc =
      ConsoleMvc.forController(new ConsolePreviewController(posts, profiles, ConsoleMvc.layout()));

  private final AdminIdentity administrator = Fixtures.moderator();
  private final UUID id = UUID.fromString("11111111-1111-4111-8111-111111111111");

  @BeforeEach
  void signIn() {
    ConsoleMvc.signIn(administrator);
  }

  @AfterEach
  void signOut() {
    ConsoleMvc.signOut();
  }

  @Test
  void postPreviewRendersReportedPostContentInsideTheAdminConsole() throws Exception {
    when(posts.requirePreviewById(id)).thenReturn(json("""
        {
          "id": "%s",
          "body": "Reported post body",
          "moderation_status": "PUBLISHED",
          "created_at": "2026-09-01T00:00:00Z",
          "profiles": { "full_name": "Mya Student", "email": "mya@example.com" }
        }
        """.formatted(id)));

    mvc.perform(get("/admin/preview/posts/{id}", id))
        .andExpect(status().isOk())
        .andExpect(view().name("admin/preview"))
        .andExpect(result -> {
          AdminPreviewView preview =
              (AdminPreviewView) result.getModelAndView().getModel().get("preview");
          assertEquals("Reported post body", preview.body());
          assertEquals("Mya Student", preview.primaryMeta());
        });
  }

  @Test
  void profilePreviewRendersReportedAccountContentInsideTheAdminConsole() throws Exception {
    when(profiles.requirePreviewById(id)).thenReturn(json("""
        {
          "id": "%s",
          "full_name": "Aung Khant",
          "email": "aung@example.com",
          "account_type": "current_student",
          "bio": "Computer science student",
          "created_at": "2026-09-01T00:00:00Z",
          "student_profiles": [
            { "verification_status": "pending", "universities": { "name": "Yangon University" } }
          ]
        }
        """.formatted(id)));

    mvc.perform(get("/admin/preview/profiles/{id}", id))
        .andExpect(status().isOk())
        .andExpect(view().name("admin/preview"))
        .andExpect(result -> {
          AdminPreviewView preview =
              (AdminPreviewView) result.getModelAndView().getModel().get("preview");
          assertEquals("Aung Khant", preview.title());
          assertEquals("aung@example.com", preview.primaryMeta());
        });
  }
}
