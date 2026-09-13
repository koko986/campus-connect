package com.takka.admin.console;

import com.takka.admin.form.ModerationReasonForm;
import com.takka.admin.model.AdminIdentity;
import com.takka.admin.model.PostModerationMetrics;
import com.takka.admin.model.PostModerationStatus;
import com.takka.admin.service.PostModerationService;
import com.takka.admin.support.MessageException;
import com.takka.admin.support.Page;
import com.takka.admin.support.PageRequest;
import jakarta.validation.Valid;
import java.util.Optional;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
  private static final Logger log = LoggerFactory.getLogger(ConsolePostsController.class);

  private final PostModerationService posts;
  private final ConsoleLayout layout;
  private final ConsoleMessages messages;

  public ConsolePostsController(
      PostModerationService posts, ConsoleLayout layout, ConsoleMessages messages) {
    this.posts = posts;
    this.layout = layout;
    this.messages = messages;
  }

  @GetMapping
  String posts(
      @AuthenticationPrincipal AdminIdentity administrator,
      @RequestParam(defaultValue = "") String status,
      @RequestParam(defaultValue = "false") boolean reported,
      @RequestParam(defaultValue = "") String highlight,
      @RequestParam(defaultValue = "0") int page,
      Model model) {
    Optional<PostModerationStatus> filter = PostModerationStatus.parse(status);
    PageRequest request = PageRequest.of(page);
    String statusFilter = filter.map(Enum::name).orElse("");

    layout.apply(model, administrator, ConsoleSection.POSTS);
    try {
      model.addAttribute("posts", posts.posts(filter, reported, request));
    } catch (RuntimeException unavailable) {
      model.addAttribute("posts", Page.empty(request));
      model.addAttribute("flashError", messages.get("error.posts.unavailable"));
    }
    try {
      model.addAttribute("postMetrics", posts.metrics());
    } catch (RuntimeException unavailable) {
      model.addAttribute("postMetrics", new PostModerationMetrics(0, 0, 0, 0));
    }
    model.addAttribute("statusFilter", statusFilter);
    model.addAttribute("reportedFilter", reported);
    model.addAttribute("highlight", highlight);
    model.addAttribute("statuses", PostModerationStatus.values());
    model.addAttribute("filterQuery", ConsoleQuery.of("status", statusFilter, "reported", reported ? "true" : ""));
    model.addAttribute("currentPage", request.page());
    return "admin/posts";
  }

  @PostMapping("/{id}/remove")
  String remove(
      @AuthenticationPrincipal AdminIdentity administrator,
      @PathVariable UUID id,
      @Valid @ModelAttribute ModerationReasonForm form,
      BindingResult binding,
      @RequestParam(defaultValue = "") String returnStatus,
      @RequestParam(defaultValue = "false") boolean returnReported,
      @RequestParam(defaultValue = "0") int returnPage,
      RedirectAttributes attributes) {
    if (binding.hasErrors()) return rejected(binding, attributes, returnStatus, returnReported, returnPage);

    try {
      posts.remove(administrator, id, form);
      Flash.success(attributes, messages.get("flash.post.removed"));
    } catch (MessageException expected) {
      Flash.error(attributes, messages.get(expected.getMessage()));
    } catch (RuntimeException unavailable) {
      String reference = AdminActionDiagnostics.log(log, "POST /admin/posts/{id}/remove", administrator, id, unavailable);
      Flash.error(attributes, messages.get("error.posts.actionUnavailable", reference));
    }
    return redirect(returnStatus, returnReported, returnPage);
  }

  @PostMapping("/{id}/restore")
  String restore(
      @AuthenticationPrincipal AdminIdentity administrator,
      @PathVariable UUID id,
      @Valid @ModelAttribute ModerationReasonForm form,
      BindingResult binding,
      @RequestParam(defaultValue = "") String returnStatus,
      @RequestParam(defaultValue = "false") boolean returnReported,
      @RequestParam(defaultValue = "0") int returnPage,
      RedirectAttributes attributes) {
    if (binding.hasErrors()) return rejected(binding, attributes, returnStatus, returnReported, returnPage);

    try {
      posts.restore(administrator, id, form);
      Flash.success(attributes, messages.get("flash.post.restored"));
    } catch (MessageException expected) {
      Flash.error(attributes, messages.get(expected.getMessage()));
    } catch (RuntimeException unavailable) {
      String reference = AdminActionDiagnostics.log(log, "POST /admin/posts/{id}/restore", administrator, id, unavailable);
      Flash.error(attributes, messages.get("error.posts.actionUnavailable", reference));
    }
    return redirect(returnStatus, returnReported, returnPage);
  }

  private String rejected(BindingResult binding, RedirectAttributes attributes, String status, boolean reported, int page) {
    Flash.error(attributes, messages.invalidSubmission(binding));
    return redirect(status, reported, page);
  }

  private static String redirect(String status, boolean reported, int page) {
    var query = new java.util.LinkedHashMap<String, String>();
    PostModerationStatus.parse(status).ifPresent(value -> query.put("status", value.name()));
    if (reported) query.put("reported", "true");
    if (page > 0) query.put("page", String.valueOf(page));
    String built = ConsoleQuery.of(query);
    return built.isBlank() ? "redirect:/admin/posts" : "redirect:/admin/posts?" + built;
  }
}
