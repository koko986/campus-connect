package com.takka.admin.model;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;

/** The enums and records that replaced the magic strings the old admin service passed around. */
class AdminModelTest {
  @Test
  void rolesParseCaseInsensitivelyAndExposeAuthorities() {
    assertEquals(Optional.of(AdminRole.SUPER_ADMIN), AdminRole.parse(" super_admin "));
    assertEquals("ROLE_MODERATOR", AdminRole.MODERATOR.authority());
    assertTrue(AdminRole.SUPER_ADMIN.isSuperAdmin());
    assertFalse(AdminRole.MODERATOR.isSuperAdmin());
    assertTrue(AdminRole.parse("owner").isEmpty());
    assertTrue(AdminRole.parse(null).isEmpty());
  }

  @Test
  void identityRequiresAnIdAndRole() {
    assertThrows(IllegalArgumentException.class, () -> new AdminIdentity(null, "a@b.c", AdminRole.MODERATOR));
    assertThrows(IllegalArgumentException.class, () -> new AdminIdentity(UUID.randomUUID(), "a@b.c", null));
    assertEquals("a@b.c", new AdminIdentity(UUID.randomUUID(), "  a@b.c ", AdminRole.MODERATOR).email());
  }

  @Test
  void reportStatusKnowsWhichStatesAreClosed() {
    assertTrue(ReportStatus.RESOLVED.isClosed());
    assertTrue(ReportStatus.DISMISSED.isClosed());
    assertFalse(ReportStatus.OPEN.isClosed());
    assertEquals(List.of(ReportStatus.OPEN, ReportStatus.REVIEWING), ReportStatus.awaitingAttention());
    assertThrows(IllegalArgumentException.class, () -> ReportStatus.require("ESCALATED"));
  }

  @Test
  void catalogResourcesMapToTables() {
    assertEquals("campuses", CatalogResource.CAMPUSES.table());
    assertEquals("Program", CatalogResource.PROGRAMS.singular());
    assertTrue(CatalogResource.require("departments") == CatalogResource.DEPARTMENTS);
    assertThrows(IllegalArgumentException.class, () -> CatalogResource.require("faculties"));
  }

  @Test
  void universityStateChangesCarryTheirAuditAction() {
    assertEquals(ModerationAction.PUBLISH_UNIVERSITY, UniversityStateChange.PUBLISH.auditAction());
    assertEquals("archive", UniversityStateChange.ARCHIVE.slug());
    assertThrows(IllegalArgumentException.class, () -> UniversityStateChange.require("delete"));
  }

  @Test
  void moderationActionsDeclareTheirTargetType() {
    assertEquals("ACCOUNT", ModerationAction.BLOCK_USER.targetType());
    assertEquals("POST", ModerationAction.REMOVE_POST.targetType());
    assertEquals("UNIVERSITY", ModerationAction.ARCHIVE_UNIVERSITY.targetType());
    assertTrue(ModerationAction.parse("not_an_action").isEmpty());
  }

  @Test
  void overviewMetricsDeriveTheirComplements() {
    var metrics = new OverviewMetrics(3, 100, 12, 500, 40, 20, 15);

    assertTrue(metrics.hasQueue());
    assertEquals(88, metrics.activeMembers());
    assertEquals(460, metrics.visiblePosts());
    assertEquals(5, metrics.draftUniversities());
  }

  @Test
  void overviewMetricsNeverGoNegative() {
    var metrics = new OverviewMetrics(0, 0, 5, 0, 9, 1, 4);

    assertFalse(metrics.hasQueue());
    assertEquals(0, metrics.activeMembers());
    assertEquals(0, metrics.visiblePosts());
    assertEquals(0, metrics.draftUniversities());
  }

  @Test
  void memberFilterNormalisesItsInputs() {
    var filter = MemberFilter.of("  ada ", "blocked");

    assertEquals("ada", filter.search());
    assertTrue(filter.hasSearch());
    assertEquals("BLOCKED", filter.statusValue());
    assertEquals("", MemberFilter.of(null, "nonsense").statusValue());
    assertFalse(MemberFilter.none().hasSearch());
  }

  @Test
  void universityViewDerivesItsVisibilityState() {
    var draft = universityView(false, false);
    var published = universityView(true, false);
    var archived = universityView(true, true);

    assertEquals("Draft", draft.state());
    assertEquals("Published", published.state());
    assertEquals("Archived", archived.state());
    assertTrue(draft.canPublish());
    assertFalse(draft.canUnpublish());
    assertTrue(published.canUnpublish());
    assertFalse(archived.canArchive());
    assertTrue(archived.canPublish());
  }

  @Test
  void postExcerptsCollapseWhitespaceAndTruncate() {
    assertEquals("one two", PostView.excerptOf("one\n\n  two  "));
    assertEquals("", PostView.excerptOf(null));
    assertTrue(PostView.excerptOf("x".repeat(400)).endsWith("…"));
    assertEquals(241, PostView.excerptOf("x".repeat(400)).length());
  }

  @Test
  void universityLocationOmitsAMissingRegion() {
    assertEquals("Yangon", universityView(true, false).location());
  }

  private static UniversityView universityView(boolean published, boolean archived) {
    return new UniversityView(
        UUID.randomUUID(),
        "yangon",
        "Yangon University",
        "YU",
        "public",
        "Yangon",
        "",
        published,
        archived,
        2,
        4,
        8,
        "29 Aug 2026 12:00 UTC");
  }
}
