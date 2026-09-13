package com.takka.config;

import com.takka.admin.session.AdminSessionFilter;
import com.takka.admin.session.AdminSessionService;
import com.takka.security.SupabaseAuthenticationFilter;
import com.takka.supabase.SupabaseGateway;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpServletResponseWrapper;
import java.io.IOException;
import java.net.URI;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/**
 * Two independent chains. The console at {@code /admin/**} is a server-rendered application with
 * cookie sessions and CSRF protection; the JSON API stays stateless and is authenticated per
 * request by a Supabase bearer token.
 *
 * <p>Both authentication filters are constructed here rather than being beans, because Spring Boot
 * registers {@code Filter} beans with the servlet container and each filter must run only inside
 * the chain it belongs to.
 */
@Configuration
public class SecurityConfig {
  private static final String LOGIN_PAGE = "/admin/login";
  private static final String[] PUBLIC_FRONTEND_ROUTES = {
      "/", "/login", "/get-started", "/register/**", "/dashboard", "/hub",
      "/universities/**", "/questions", "/questions/**", "/messages", "/notifications", "/saved",
      "/profile", "/profiles/**", "/posts/**", "/settings", "/assets/**", "/favicon.ico",
      "/favicon.svg", "/takka-logo.png", "/robots.txt"
  };

  @Bean
  @Order(Ordered.HIGHEST_PRECEDENCE)
  SecurityFilterChain adminConsoleSecurity(HttpSecurity http, AdminSessionService sessions) throws Exception {
    return http
        .securityMatcher("/admin", "/admin/**")
        .authorizeHttpRequests(auth -> auth
            .requestMatchers(LOGIN_PAGE, "/admin/forbidden", "/admin/assets/**").permitAll()
            .anyRequest().hasAuthority(AdminSessionFilter.ADMIN_AUTHORITY))
        .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
        .exceptionHandling(exceptions -> exceptions
            .authenticationEntryPoint((request, response, denied) -> response.sendRedirect(LOGIN_PAGE))
            .accessDeniedPage("/admin/forbidden"))
        .addFilterBefore(new SameHostRelativeRedirectFilter(), UsernamePasswordAuthenticationFilter.class)
        .addFilterBefore(new AdminSessionFilter(sessions), UsernamePasswordAuthenticationFilter.class)
        .build();
  }

  @Bean
  @Order(Ordered.LOWEST_PRECEDENCE)
  SecurityFilterChain apiSecurity(HttpSecurity http, SupabaseGateway supabase) throws Exception {
    return http
        .csrf(csrf -> csrf.disable())
        .cors(cors -> {})
        .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/actuator/health", "/error", "/api/supabase/**").permitAll()
            .requestMatchers(PUBLIC_FRONTEND_ROUTES).permitAll()
            .anyRequest().authenticated())
        .addFilterBefore(new SupabaseAuthenticationFilter(supabase), UsernamePasswordAuthenticationFilter.class)
        .build();
  }

  @Bean
  UrlBasedCorsConfigurationSource corsConfigurationSource(
      @Value("${takka.frontend-origin}") String origin) {
    var configuration = new CorsConfiguration();
    configuration.setAllowedOriginPatterns(List.of(
        origin, origin.replace("localhost", "127.0.0.1"),
        "http://localhost:*", "http://127.0.0.1:*", "https://*.vercel.app",
        "https://*.up.railway.app"));
    configuration.setAllowedHeaders(List.of("*"));
    configuration.setExposedHeaders(List.of(
        "Content-Range", "Range", "X-Supabase-Api-Version"));
    configuration.setAllowedMethods(List.of("GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"));
    configuration.setAllowCredentials(true);
    var source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/api/**", configuration);
    return source;
  }

  /**
   * Railway terminates HTTPS before the Java process. If a servlet redirect is expanded to
   * {@code http://...}, keep the user on the current browser scheme by sending a relative Location.
   */
  private static final class SameHostRelativeRedirectFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
        throws ServletException, IOException {
      chain.doFilter(request, new RelativeRedirectResponse(response, request));
    }
  }

  private static final class RelativeRedirectResponse extends HttpServletResponseWrapper {
    private final HttpServletRequest request;

    private RelativeRedirectResponse(HttpServletResponse response, HttpServletRequest request) {
      super(response);
      this.request = request;
    }

    @Override
    public void sendRedirect(String location) throws IOException {
      String relative = sameHostRelativeLocation(location);
      if (relative == null) {
        super.sendRedirect(location);
        return;
      }
      setStatus(SC_FOUND);
      setHeader("Location", encodeRedirectURL(relative));
    }

    private String sameHostRelativeLocation(String location) {
      if (location == null || location.isBlank()) return "/";
      if (location.startsWith("/")) return location;
      try {
        URI uri = URI.create(location);
        if (uri.getHost() == null || !uri.getHost().equalsIgnoreCase(request.getServerName())) {
          return null;
        }
        String path = uri.getRawPath() == null || uri.getRawPath().isBlank() ? "/" : uri.getRawPath();
        String query = uri.getRawQuery() == null ? "" : "?" + uri.getRawQuery();
        String fragment = uri.getRawFragment() == null ? "" : "#" + uri.getRawFragment();
        return path + query + fragment;
      } catch (IllegalArgumentException invalid) {
        return null;
      }
    }
  }
}
