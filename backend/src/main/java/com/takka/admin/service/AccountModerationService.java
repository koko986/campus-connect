package com.takka.admin.service;

import com.takka.admin.form.MemberDeleteForm;
import com.takka.admin.form.ModerationReasonForm;
import com.takka.admin.mapper.MemberMapper;
import com.takka.admin.model.AdminIdentity;
import com.takka.admin.model.MemberFilter;
import com.takka.admin.model.MemberView;
import com.takka.admin.model.ModerationAction;
import com.takka.admin.repository.AccountModerationRepository;
import com.takka.admin.repository.AdminUserRepository;
import com.takka.admin.repository.ProfileRepository;
import com.takka.admin.support.Json;
import com.takka.admin.support.MessageException;
import com.takka.admin.support.Page;
import com.takka.admin.support.PageRequest;
import com.takka.supabase.SupabaseGateway;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import tools.jackson.databind.JsonNode;

/** Member account listing, blocking, unblocking, and deletion. */
@Service
public class AccountModerationService {
  /** Supabase expresses an indefinite ban as a very long duration. */
  private static final String INDEFINITE_BAN = "876000h";
  private static final String LIFT_BAN = "none";

  private final ProfileRepository profileRepository;
  private final AccountModerationRepository moderationRepository;
  private final AdminUserRepository adminUserRepository;
  private final ReportModerationService reportModeration;
  private final AuditTrailService auditTrail;
  private final SupabaseGateway supabase;

  public AccountModerationService(
      ProfileRepository profileRepository,
      AccountModerationRepository moderationRepository,
      AdminUserRepository adminUserRepository,
      ReportModerationService reportModeration,
      AuditTrailService auditTrail,
      SupabaseGateway supabase) {
    this.profileRepository = profileRepository;
    this.moderationRepository = moderationRepository;
    this.adminUserRepository = adminUserRepository;
    this.reportModeration = reportModeration;
    this.auditTrail = auditTrail;
    this.supabase = supabase;
  }

  public Page<MemberView> members(MemberFilter filter, PageRequest request) {
    Set<UUID> administrators = adminUserRepository.findActiveAdministratorIds();
    var blockedIds = moderationRepository.findBlockedUserIds();
    return profileRepository
        .findMembers(filter, request, blockedIds)
        .map(row -> MemberMapper.toView(row, administrators));
  }

  public long totalMembers() {
    return profileRepository.countAll();
  }

  public long blockedMembers() {
    return moderationRepository.countBlocked();
  }

  public String block(AdminIdentity administrator, UUID userId, ModerationReasonForm form) {
    AdminAccess.requireAdministrator(administrator);
    JsonNode profile = requireModeratableMember(administrator, userId);

    supabase.updateAuthUser(userId, Map.of("ban_duration", INDEFINITE_BAN));
    moderationRepository.block(userId, form.getReason(), administrator.userId());
    auditTrail.record(
        administrator,
        ModerationAction.BLOCK_USER,
        userId,
        form.getReason(),
        form.getReportId(),
        profile);
    reportModeration.closeLinkedReport(administrator, form.linkedReport(), form.getReason());
    return Json.text(profile, "full_name", Json.text(profile, "email"));
  }

  public String unblock(AdminIdentity administrator, UUID userId, ModerationReasonForm form) {
    AdminAccess.requireAdministrator(administrator);
    JsonNode profile = profileRepository.requireById(userId);

    supabase.updateAuthUser(userId, Map.of("ban_duration", LIFT_BAN));
    moderationRepository.unblock(userId, form.getReason());
    auditTrail.record(
        administrator,
        ModerationAction.UNBLOCK_USER,
        userId,
        form.getReason(),
        form.getReportId(),
        profile);
    return Json.text(profile, "full_name", Json.text(profile, "email"));
  }

  /**
   * Permanently deletes an account. Restricted to super admins, and the administrator must retype
   * the member's email so a mis-click cannot destroy the wrong account.
   */
  public String delete(AdminIdentity administrator, UUID userId, MemberDeleteForm form) {
    AdminAccess.requireSuperAdmin(administrator);
    JsonNode profile = requireModeratableMember(administrator, userId);

    String email = Json.text(profile, "email");
    if (!form.matches(email)) {
      throw new MessageException("error.member.emailMismatch");
    }

    supabase.deleteAuthUser(userId);
    auditTrail.record(
        administrator,
        ModerationAction.DELETE_USER,
        userId,
        form.getReason(),
        form.getReportId(),
        profile);
    reportModeration.closeLinkedReport(administrator, form.linkedReport(), form.getReason());
    return email;
  }

  /** Blocks the two targets that must never be moderated: yourself and another live administrator. */
  private JsonNode requireModeratableMember(AdminIdentity administrator, UUID userId) {
    if (administrator.userId().equals(userId)) {
      throw new MessageException("error.member.selfModeration");
    }
    if (adminUserRepository.isActiveAdmin(userId)) {
      throw new AccessDeniedException("error.member.administratorProtected");
    }
    return profileRepository.requireById(userId);
  }
}
