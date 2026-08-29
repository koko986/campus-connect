package com.takka.admin.service;

import static com.takka.admin.Fixtures.json;
import static com.takka.admin.Fixtures.moderator;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.takka.admin.model.ModerationAction;
import com.takka.admin.repository.UniversityPhotoRepository;
import com.takka.admin.support.MessageException;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class UniversityPhotoModerationServiceTest {
  private final UniversityPhotoRepository photos = mock(UniversityPhotoRepository.class);
  private final AuditTrailService auditTrail = mock(AuditTrailService.class);
  private final UniversityPhotoModerationService service =
      new UniversityPhotoModerationService(photos, auditTrail);
  private final UUID photoId = UUID.fromString("11111111-1111-4111-8111-111111111111");
  private final UUID universityId = UUID.fromString("22222222-2222-4222-8222-222222222222");

  @Test
  void approvalUsesThePhotoAsTheCoverWhenTheUniversityStillNeedsOne() {
    when(photos.decide(eq(photoId), eq("APPROVED"), any(), eq("Clear campus view")))
        .thenReturn(
            Optional.of(
                json(
                    """
                    {
                      "id": "%s",
                      "university_id": "%s",
                      "image_path": "member/photo.jpg",
                      "uploader": {"full_name": "Mya Student"}
                    }
                    """
                        .formatted(photoId, universityId))));

    service.decide(moderator(), photoId, "APPROVED", "Clear campus view");

    verify(photos)
        .useAsCoverIfMissing(universityId, "member/photo.jpg", "Mya Student");
    verify(auditTrail)
        .record(
            any(),
            eq(ModerationAction.APPROVE_UNIVERSITY_PHOTO),
            eq(photoId),
            eq("Clear campus view"),
            eq(null),
            any());
  }

  @Test
  void rejectionDoesNotChangeTheUniversityCover() {
    when(photos.decide(eq(photoId), eq("REJECTED"), any(), eq("Not a campus photo")))
        .thenReturn(
            Optional.of(
                json(
                    """
                    {"id":"%s","university_id":"%s","image_path":"member/photo.jpg"}
                    """
                        .formatted(photoId, universityId))));

    service.decide(moderator(), photoId, "REJECTED", "Not a campus photo");

    verify(photos, never()).useAsCoverIfMissing(any(), any(), any());
    verify(auditTrail)
        .record(
            any(),
            eq(ModerationAction.REJECT_UNIVERSITY_PHOTO),
            eq(photoId),
            eq("Not a campus photo"),
            eq(null),
            any());
  }

  @Test
  void pendingIsNotAValidModerationDecision() {
    assertThrows(
        MessageException.class,
        () -> service.decide(moderator(), photoId, "PENDING", ""));
    verify(photos, never()).decide(any(), any(), any(), any());
    verify(auditTrail, never()).record(any(), any(), any(), any(), any(), any());
  }
}
