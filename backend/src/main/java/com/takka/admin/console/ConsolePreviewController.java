package com.takka.admin.console;

import com.takka.admin.model.AdminIdentity;
import com.takka.admin.model.AdminPreviewField;
import com.takka.admin.model.AdminPreviewView;
import com.takka.admin.repository.PostRepository;
import com.takka.admin.repository.ProfileRepository;
import com.takka.admin.support.Json;
import com.takka.admin.support.Timestamps;
import java.util.List;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import tools.jackson.databind.JsonNode;

/** Read-only previews of student-facing objects that are safe for administrators to inspect. */
@Controller
@RequestMapping("/admin/preview")
public class ConsolePreviewController {
  private final PostRepository posts;
  private final ProfileRepository profiles;
  private final ConsoleLayout layout;

  public ConsolePreviewController(PostRepository posts, ProfileRepository profiles, ConsoleLayout layout) {
    this.posts = posts;
    this.profiles = profiles;
    this.layout = layout;
  }

  @GetMapping("/posts/{id}")
  String post(@AuthenticationPrincipal AdminIdentity administrator, @PathVariable UUID id, Model model) {
    JsonNode post = posts.requirePreviewById(id);
    JsonNode author = Json.embeddedRow(post, "profiles");
    layout.apply(model, administrator, ConsoleSection.REPORTS);
    model.addAttribute("preview", new AdminPreviewView(
        "Post",
        "enum.reportTarget.POST",
        Json.text(post, "moderation_status", "PUBLISHED"),
        Json.text(post, "body"),
        Json.text(author, "full_name", "Deleted member"),
        Timestamps.format(Json.optionalInstant(post, "created_at")),
        List.of(
            new AdminPreviewField("column.author", Json.text(author, "email")),
            new AdminPreviewField("column.status", Json.text(post, "moderation_status", "PUBLISHED")),
            new AdminPreviewField("field.reason", Json.text(post, "removal_reason")))));
    return "admin/preview";
  }

  @GetMapping("/profiles/{id}")
  String profile(@AuthenticationPrincipal AdminIdentity administrator, @PathVariable UUID id, Model model) {
    JsonNode profile = profiles.requirePreviewById(id);
    JsonNode student = Json.embeddedRow(profile, "student_profiles");
    JsonNode university = Json.embeddedRow(student, "universities");
    layout.apply(model, administrator, ConsoleSection.REPORTS);
    model.addAttribute("preview", new AdminPreviewView(
        Json.text(profile, "full_name", "Member profile"),
        "enum.reportTarget.ACCOUNT",
        Json.text(profile, "account_type"),
        Json.text(profile, "bio"),
        Json.text(profile, "email"),
        Timestamps.format(Json.optionalInstant(profile, "created_at")),
        List.of(
            new AdminPreviewField("field.university", Json.text(university, "name")),
            new AdminPreviewField("field.status", Json.text(student, "verification_status")),
            new AdminPreviewField("field.type", Json.text(profile, "account_type")),
            new AdminPreviewField("field.email", Json.text(profile, "email")))));
    return "admin/preview";
  }
}
