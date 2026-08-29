package com.takka.admin.console;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.flash;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.model;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.redirectedUrl;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.view;

import com.takka.admin.Fixtures;
import com.takka.admin.model.AdminIdentity;
import com.takka.admin.model.PostModerationStatus;
import com.takka.admin.service.PostModerationService;
import com.takka.admin.support.MessageException;
import com.takka.admin.support.Page;
import com.takka.admin.support.PageRequest;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;

class ConsolePostsControllerTest {
  private final PostModerationService posts = mock(PostModerationService.class);
  private final MockMvc mvc = ConsoleMvc.forController(
      new ConsolePostsController(posts, ConsoleMvc.layout(), ConsoleMvc.consoleMessages()));

  private final AdminIdentity administrator = Fixtures.moderator();
  private final UUID postId = UUID.randomUUID();

  @BeforeEach
  void signIn() {
    ConsoleMvc.signIn(administrator);
    when(posts.posts(any(), any())).thenReturn(Page.empty(PageRequest.of(0)));
  }

  @AfterEach
  void signOut() {
    ConsoleMvc.signOut();
  }

  @Test
  void thePostsPageRendersWithTheConsoleShellAttributes() throws Exception {
    mvc.perform(get("/admin/posts"))
        .andExpect(status().isOk())
        .andExpect(view().name("admin/posts"))
        .andExpect(model().attribute("section", ConsoleSection.POSTS))
        .andExpect(model().attributeExists("posts", "statuses", "statusFilter", "filterQuery"));
  }

  @Test
  void aStatusFilterIsParsedAndKeptForPaging() throws Exception {
    mvc.perform(get("/admin/posts").param("status", "removed"))
        .andExpect(model().attribute("statusFilter", "REMOVED"))
        .andExpect(model().attribute("filterQuery", "status=REMOVED"));

    verify(posts).posts(eq(Optional.of(PostModerationStatus.REMOVED)), any());
  }

  @Test
  void removingAPostRedirectsBackToTheFilteredList() throws Exception {
    mvc.perform(post("/admin/posts/{id}/remove", postId)
            .param("reason", "Spam link")
            .param("returnStatus", "PUBLISHED"))
        .andExpect(redirectedUrl("/admin/posts?status=PUBLISHED"))
        .andExpect(flash().attribute("flashSuccess", "Post removed from the community feed."));

    verify(posts).remove(eq(administrator), eq(postId), any());
  }

  @Test
  void restoringAPostRedirectsToTheUnfilteredList() throws Exception {
    mvc.perform(post("/admin/posts/{id}/restore", postId).param("reason", "Removed by mistake"))
        .andExpect(redirectedUrl("/admin/posts"))
        .andExpect(flash().attribute("flashSuccess", "Post restored and visible again."));

    verify(posts).restore(eq(administrator), eq(postId), any());
  }

  @Test
  void aMissingReasonIsRejectedBeforeTheServiceIsCalled() throws Exception {
    mvc.perform(post("/admin/posts/{id}/remove", postId).param("reason", ""))
        .andExpect(redirectedUrl("/admin/posts"))
        .andExpect(flash().attributeExists("flashError"));

    verify(posts, never()).remove(any(), any(), any());
  }

  @Test
  void aMissingPostIsReportedOnTheReferringPage() throws Exception {
    doThrow(new MessageException("error.post.notFound")).when(posts).remove(any(), any(), any());

    mvc.perform(post("/admin/posts/{id}/remove", postId)
            .param("reason", "Spam link")
            .header("Referer", "http://localhost/admin/posts?status=PUBLISHED"))
        .andExpect(redirectedUrl("/admin/posts?status=PUBLISHED"))
        .andExpect(flash().attribute("flashError", "Post not found."));
  }

  @Test
  void aRemovalIsConfirmedInTheRequestedLanguage() throws Exception {
    mvc.perform(post("/admin/posts/{id}/remove", postId)
            .param("reason", "Spam link")
            .locale(ConsoleMvc.MYANMAR))
        .andExpect(flash().attribute(
            "flashSuccess", "ပို့စ်ကို အသိုက်အဝန်း ဖိဒ်မှ ဖယ်ရှားလိုက်ပါပြီ။"));
  }
}
