package com.takka.admin.mapper;

import static com.takka.admin.Fixtures.json;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.takka.admin.model.AccountStatus;
import com.takka.admin.model.CatalogResource;
import com.takka.admin.model.ModerationAction;
import com.takka.admin.model.PostModerationStatus;
import com.takka.admin.model.ReportStatus;
import com.takka.admin.model.ReportTargetType;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class AdminMapperTest {
  private static final UUID ID = UUID.fromString("6f1cf1d0-0f52-4b0e-9d2a-3f2c8bb1a111");

  @Test
  void mapsAReportWithAnAccountSnapshot() {
    var view = ReportMapper.toView(json("""
        {
          "id": "%s",
          "target_type": "ACCOUNT",
          "target_id": "%s",
          "reason": "HARASSMENT",
          "details": "Sending abusive messages",
          "status": "OPEN",
          "resolution_notes": null,
          "assigned_to": null,
          "created_at": "2026-08-20T09:00:00Z",
          "target_snapshot": { "full_name": "Ada Lovelace" }
        }
        """.formatted(ID, ID)));

    assertEquals(ID, view.id());
    assertEquals(ReportTargetType.ACCOUNT, view.targetType());
    assertEquals(ReportStatus.OPEN, view.status());
    assertEquals("Ada Lovelace", view.targetLabel());
    assertEquals("danger", view.statusTone());
    assertTrue(view.hasDetails());
    assertFalse(view.hasResolutionNotes());
    assertFalse(view.assigned());
    assertTrue(view.isActionable());
  }

  @Test
  void aPostReportLabelFallsBackToTheSnapshotBody() {
    var view = ReportMapper.toView(json("""
        {
          "id": "%s",
          "target_type": "POST",
          "target_id": "%s",
          "reason": "SPAM",
          "status": "RESOLVED",
          "resolution_notes": "Removed the post",
          "assigned_to": "%s",
          "created_at": "2026-08-20T09:00:00Z",
          "target_snapshot": { "body": "Buy   followers now" }
        }
        """.formatted(ID, ID, ID)));

    assertEquals("Buy followers now", view.targetLabel());
    assertEquals("success", view.statusTone());
    assertTrue(view.assigned());
    assertTrue(view.hasResolutionNotes());
    assertFalse(view.isActionable());
  }

  @Test
  void mapsAMemberWithItsStudentAndModerationEmbeds() {
    var view = MemberMapper.toView(
        json("""
            {
              "id": "%s",
              "full_name": "Ada Lovelace",
              "email": "ada@takka.test",
              "account_type": "current_student",
              "created_at": "2026-01-05T08:00:00Z",
              "student_profiles": [
                { "verification_status": "verified", "universities": { "name": "Yangon University" } }
              ],
              "account_moderation": [
                { "status": "BLOCKED", "reason": "Repeated harassment", "blocked_at": "2026-08-01T00:00:00Z" }
              ]
            }
            """.formatted(ID)),
        Set.of());

    assertEquals("Current student", view.accountType());
    assertEquals("Verified", view.verification());
    assertEquals("Yangon University", view.university());
    assertEquals(AccountStatus.BLOCKED, view.status());
    assertTrue(view.isBlocked());
    assertTrue(view.hasBlockReason());
    assertTrue(view.isModeratable());
    assertEquals("danger", view.statusTone());
  }

  @Test
  void aMemberWithNoModerationRowIsActiveAndAdminsAreShielded() {
    var view = MemberMapper.toView(
        json("""
            { "id": "%s", "full_name": "Grace", "email": "grace@takka.test",
              "account_type": "prospective_student", "created_at": "2026-01-05T08:00:00Z",
              "student_profiles": [], "account_moderation": [] }
            """.formatted(ID)),
        Set.of(ID));

    assertEquals(AccountStatus.ACTIVE, view.status());
    assertEquals("Prospective student", view.accountType());
    assertFalse(view.hasUniversity());
    assertFalse(view.isModeratable());
    assertEquals("success", view.statusTone());
  }

  @Test
  void mapsAPostWithItsAuthorAndReportTally() {
    var view = PostMapper.toView(
        json("""
            {
              "id": "%s",
              "body": "Hello   campus",
              "created_at": "2026-08-10T10:00:00Z",
              "moderation_status": "REMOVED",
              "removal_reason": "Spam",
              "removed_at": "2026-08-11T10:00:00Z",
              "profiles": { "full_name": "Ada", "email": "ada@takka.test" }
            }
            """.formatted(ID)),
        Map.of(ID, 3));

    assertEquals("Hello campus", view.excerpt());
    assertEquals(PostModerationStatus.REMOVED, view.status());
    assertEquals(3, view.reportCount());
    assertTrue(view.isReported());
    assertTrue(view.hasRemovalReason());
    assertTrue(view.hasAuthor());
    assertFalse(view.isPublished());
  }

  @Test
  void aPostFromADeletedAuthorHasNoAuthorDetails() {
    var view = PostMapper.toView(
        json("""
            { "id": "%s", "body": "Orphaned", "created_at": "2026-08-10T10:00:00Z",
              "moderation_status": "PUBLISHED", "profiles": null }
            """.formatted(ID)),
        Map.of());

    assertFalse(view.hasAuthor());
    assertFalse(view.isReported());
    assertTrue(view.isPublished());
    assertEquals("—", view.removed());
  }

  @Test
  void mapsAUniversityWithItsCatalogCounts() {
    var view = UniversityMapper.toView(json("""
        {
          "id": "%s", "slug": "yangon", "name": "Yangon University", "short_name": "YU",
          "university_type": "public", "city": "Yangon", "region": "Yangon Region",
          "is_published": true, "archived_at": null, "updated_at": "2026-08-20T09:00:00Z",
          "campuses": [{ "count": 2 }], "departments": [{ "count": 12 }], "programs": [{ "count": 40 }]
        }
        """.formatted(ID)));

    assertEquals(2, view.campuses());
    assertEquals(12, view.departments());
    assertEquals(40, view.programs());
    assertEquals("Published", view.state());
    assertEquals("Yangon, Yangon Region", view.location());
  }

  @Test
  void mapsAUniversityOntoTheEditForm() {
    var form = UniversityMapper.toForm(json("""
        {
          "id": "%s", "slug": "yangon", "name": "Yangon University", "short_name": "YU",
          "university_type": "private", "city": "Yangon", "region": null, "country_code": "MM",
          "description": "A university", "about": null, "website_url": "https://yu.edu.mm",
          "founded_year": 1920, "is_published": false
        }
        """.formatted(ID)));

    assertEquals("yangon", form.getSlug());
    assertEquals("private", form.getUniversityType());
    assertEquals("", form.getRegion());
    assertEquals(1920, form.getFoundedYear());
    assertFalse(form.isPublished());
  }

  @Test
  void mapsAProgramWithItsParentDepartment() {
    var view = CatalogMapper.toView(
        json("""
            { "id": "%s", "name": "Computer Science", "degree_level": "Bachelor",
              "description": "Four years", "source_url": "https://yu.edu.mm/cs",
              "department_id": "%s", "departments": { "name": "Engineering" } }
            """.formatted(ID, ID)),
        CatalogResource.PROGRAMS);

    assertEquals("Engineering", view.department());
    assertEquals("Engineering", view.detail());
    assertTrue(view.hasDegreeLevel());
    assertTrue(view.hasSourceUrl());
    assertEquals(ID, view.departmentId());
  }

  @Test
  void aCampusDetailPrefersTheAddress() {
    var withAddress = CatalogMapper.toView(
        json("{ \"id\": \"" + ID + "\", \"name\": \"Main\", \"city\": \"Yangon\", \"address\": \"1 Road\" }"),
        CatalogResource.CAMPUSES);
    var withoutAddress = CatalogMapper.toView(
        json("{ \"id\": \"" + ID + "\", \"name\": \"Main\", \"city\": \"Yangon\" }"), CatalogResource.CAMPUSES);

    assertEquals("1 Road", withAddress.detail());
    assertEquals("Yangon", withoutAddress.detail());
  }

  @Test
  void catalogSelectListsTheDepartmentEmbedOnlyForPrograms() {
    assertTrue(CatalogMapper.selectFor(CatalogResource.PROGRAMS).contains("departments(name)"));
    assertFalse(CatalogMapper.selectFor(CatalogResource.CAMPUSES).contains("departments"));
    assertTrue(CatalogMapper.selectFor(CatalogResource.CAMPUSES).contains("latitude"));
  }

  @Test
  void mapsAnAuditEntry() {
    var view = AuditMapper.toView(json("""
        {
          "id": "%s", "admin_email": "super@takka.test", "action": "BLOCK_USER",
          "target_type": "ACCOUNT", "target_id": "%s", "reason": "Harassment",
          "report_id": "%s", "created_at": "2026-08-21T11:30:00Z",
          "target_snapshot": { "full_name": "Ada Lovelace" }
        }
        """.formatted(ID, ID, ID)));

    assertEquals(ModerationAction.BLOCK_USER, view.action());
    assertEquals("Blocked account", view.actionLabel());
    assertEquals("Ada Lovelace", view.targetLabel());
    assertEquals("danger", view.actionTone());
    assertTrue(view.linkedToReport());
  }

  @Test
  void anUnknownAuditActionKeepsItsRawLabel() {
    var view = AuditMapper.toView(json("""
        { "id": "%s", "admin_email": "a@b.c", "action": "FUTURE_ACTION", "target_type": "ACCOUNT",
          "target_id": "%s", "reason": "why", "report_id": null, "created_at": "2026-08-21T11:30:00Z",
          "target_snapshot": {} }
        """.formatted(ID, ID)));

    assertEquals("FUTURE_ACTION", view.actionLabel());
    assertEquals("muted", view.actionTone());
    assertFalse(view.linkedToReport());
    assertFalse(view.hasTargetLabel());
  }

  @Test
  void snapshotLabelsFallBackThroughTheAvailableFields() {
    assertEquals("Ada", SnapshotLabel.of(json("{\"full_name\":\"Ada\"}")));
    assertEquals("Yangon University", SnapshotLabel.of(json("{\"name\":\"Yangon University\"}")));
    assertEquals("a@b.c", SnapshotLabel.of(json("{\"email\":\"a@b.c\"}")));
    assertEquals("", SnapshotLabel.of(json("{}")));
  }
}
