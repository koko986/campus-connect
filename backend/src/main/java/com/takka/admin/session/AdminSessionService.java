package com.takka.admin.session;

import com.takka.admin.form.AdminLoginForm;
import com.takka.admin.model.AdminIdentity;
import com.takka.admin.model.AdminRole;
import com.takka.admin.repository.AdminUserRepository;
import com.takka.security.TakkaPrincipal;
import com.takka.supabase.SupabaseGateway;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientResponseException;

/**
 * Signs administrators in and holds the console session. Ordinary member credentials are refused
 * here, so the console never issues a session to a student account.
 */
@Service
public class AdminSessionService {
  static final String SESSION_ATTRIBUTE = "takka.admin.session";
  private static final String REJECTED = "Invalid email or password";

  private final SupabaseGateway supabase;
  private final AdminUserRepository adminUserRepository;

  public AdminSessionService(SupabaseGateway supabase, AdminUserRepository adminUserRepository) {
    this.supabase = supabase;
    this.adminUserRepository = adminUserRepository;
  }

  public AdminIdentity signIn(AdminLoginForm form) {
    TakkaPrincipal principal = authenticate(form);
    AdminRole role = adminUserRepository
        .findActiveRole(principal.id())
        .orElseThrow(() -> new AdminSignInException("This account is not a TAKKA administrator"));
    return new AdminIdentity(principal.id(), principal.email(), role);
  }

  private TakkaPrincipal authenticate(AdminLoginForm form) {
    try {
      return supabase.signInWithPassword(form.getEmail(), form.getPassword());
    } catch (IllegalArgumentException rejected) {
      throw new AdminSignInException(REJECTED);
    } catch (RestClientResponseException upstream) {
      // Supabase answers 400 for bad credentials and 429 when rate limiting sign-in attempts.
      throw new AdminSignInException(
          upstream.getStatusCode().value() == 429
              ? "Too many sign-in attempts. Please wait and try again."
              : REJECTED);
    }
  }

  /** Starts a fresh session so a pre-existing session id cannot be reused after sign-in. */
  public void begin(HttpServletRequest request, AdminIdentity identity) {
    HttpSession existing = request.getSession(false);
    if (existing != null) existing.invalidate();
    request.getSession(true).setAttribute(SESSION_ATTRIBUTE, AdminSession.of(identity));
  }

  public Optional<AdminSession> read(HttpServletRequest request) {
    HttpSession session = request.getSession(false);
    if (session == null) return Optional.empty();
    return session.getAttribute(SESSION_ATTRIBUTE) instanceof AdminSession stored
        ? Optional.of(stored)
        : Optional.empty();
  }

  public void refreshRole(HttpServletRequest request, AdminSession session, AdminRole current) {
    HttpSession httpSession = request.getSession(false);
    if (httpSession != null) httpSession.setAttribute(SESSION_ATTRIBUTE, session.withRole(current));
  }

  public void end(HttpServletRequest request) {
    HttpSession session = request.getSession(false);
    if (session != null) session.invalidate();
  }

  /** Confirms the stored administrator is still active, returning their current role. */
  public Optional<AdminRole> currentRole(AdminSession session) {
    return adminUserRepository.findActiveRole(session.userId());
  }
}
