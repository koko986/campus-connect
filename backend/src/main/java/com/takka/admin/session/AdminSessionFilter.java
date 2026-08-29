package com.takka.admin.session;

import com.takka.admin.model.AdminIdentity;
import com.takka.admin.model.AdminRole;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Turns a console session into a Spring Security authentication. The administrator's role is read
 * from the database on every request, so revoking an assignment takes effect immediately instead of
 * lasting until the session expires.
 *
 * <p>Deliberately not a bean: Spring Boot auto-registers {@code Filter} beans for every request, and
 * this filter must only run inside the console security chain.
 */
public class AdminSessionFilter extends OncePerRequestFilter {
  /** Granted to every administrator, and the authority the console URL rules require. */
  public static final String ADMIN_AUTHORITY = "ROLE_ADMIN";

  private final AdminSessionService sessions;

  public AdminSessionFilter(AdminSessionService sessions) {
    this.sessions = sessions;
  }

  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
      throws ServletException, IOException {
    Optional<AdminSession> stored = sessions.read(request);
    if (stored.isPresent()) {
      AdminSession session = stored.get();
      Optional<AdminRole> role = sessions.currentRole(session);
      if (role.isEmpty()) {
        sessions.end(request);
        SecurityContextHolder.clearContext();
      } else {
        if (role.get() != session.role()) sessions.refreshRole(request, session, role.get());
        authenticate(new AdminIdentity(session.userId(), session.email(), role.get()));
      }
    }
    chain.doFilter(request, response);
  }

  private static void authenticate(AdminIdentity identity) {
    var authentication = new UsernamePasswordAuthenticationToken(identity, null, authorities(identity.role()));
    SecurityContextHolder.getContext().setAuthentication(authentication);
  }

  private static List<GrantedAuthority> authorities(AdminRole role) {
    var authorities = new ArrayList<GrantedAuthority>(2);
    authorities.add(new SimpleGrantedAuthority(ADMIN_AUTHORITY));
    authorities.add(new SimpleGrantedAuthority(role.authority()));
    return authorities;
  }
}
