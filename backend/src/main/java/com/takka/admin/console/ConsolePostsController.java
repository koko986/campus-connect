package com.takka.admin.console;

import com.takka.admin.form.ModerationReasonForm;
import com.takka.admin.model.AdminIdentity;
import com.takka.admin.model.PostModerationStatus;
import com.takka.admin.service.PostModerationService;
import com.takka.admin.support.PageRequest;
import jakarta.validation.Valid;
import java.util.Optional;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

/** Post moderation: review reported content, then remove or restore it. */
@Controller
@RequestMapping("/admin/posts")
public class ConsolePostsController {
  private final PostModerationService posts;
  private final ConsoleLayout layout;

  public ConsolePostsController(PostModerationService posts, ConsoleLayout layout) {
    this.posts = posts;
    this.layout = layout;
  }

  @GetMapping
  String posts(
      @AuthenticationPrincipal AdminIdentity administrator,
      @RequestParam(defaultValue = "") String status,
      @RequestParam(defaultValue = "0") int page,
      Model model) {
    Optional<PostModerationStatus> filter = PostModerationStatus.parse(status);

    String statusFilter = filter.map(Enum::name).orElse("");

    layout.apply(model, administrator, ConsoleSection.POSTS);
    model.addAttribute("posts", posts.posts(filter, PageRequest.of(page)));
    model.addAttribute("statusFilter", statusFilter);
    model.addAttribute("statuses", PostModerationStatus.values());
    model.addAttribute("filterQuery", ConsoleQuery.of("status", statusFilter));
    return "admin/posts";
  }

  @PostMapping("/{id}/remove")
  String remove(
      @AuthenticationPrincipal AdminIdentity administrator,
      @PathVariable UUID id,
      @Valid @ModelAttribute ModerationReasonForm form,
      BindingResult binding,
      @RequestParam(defaultValue = "") String returnStatus,
      RedirectAttributes attributes) {
    if (binding.hasErrors()) return rejected(binding, attributes, returnStatus);

    posts.remove(administrator, id, form);
    Flash.success(attributes, "Post removed from the community feed.");
    return redirect(returnStatus);
  }

  @PostMapping("/{id}/restore")
  String restore(
      @AuthenticationPrincipal AdminIdentity administrator,
      @PathVariable UUID id,
      @Valid @ModelAttribute ModerationReasonForm form,
      BindingResult binding,
      @RequestParam(defaultValue = "") String returnStatus,
      RedirectAttributes attributes) {
    if (binding.hasErrors()) return rejected(binding, attributes, returnStatus);

    posts.restore(administrator, id, form);
    Flash.success(attributes, "Post restored and visible again.");
    return redirect(returnStatus);
  }

  private static String rejected(BindingResult binding, RedirectAttributes attributes, String status) {
    Flash.error(attributes, Flash.firstMessage(binding));
    return redirect(status);
  }

  private static String redirect(String status) {
    return PostModerationStatus.parse(status)
        .map(value -> "redirect:/admin/posts?status=" + value.name())
        .orElse("redirect:/admin/posts");
  }
}
