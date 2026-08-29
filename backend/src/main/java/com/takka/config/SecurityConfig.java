package com.takka.config;

import com.takka.admin.session.AdminSessionFilter;
import com.takka.admin.session.AdminSessionService;
import com.takka.security.SupabaseAuthenticationFilter;
import com.takka.supabase.SupabaseGateway;
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

  @Bean
  @Order(Ordered.HIGHEST_PRECEDENCE)
  SecurityFilterChain adminConsoleSecurity(HttpSecurity http, AdminSessionService sessions) throws Exception {
    return http
        .securityMatcher("/admin/**")
        .authorizeHttpRequests(auth -> auth
            .requestMatchers(LOGIN_PAGE, "/admin/forbidden", "/admin/assets/**").permitAll()
            .anyRequest().hasAuthority(AdminSessionFilter.ADMIN_AUTHORITY))
        .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
        .exceptionHandling(exceptions -> exceptions
            .authenticationEntryPoint((request, response, denied) -> response.sendRedirect(LOGIN_PAGE))
            .accessDeniedPage("/admin/forbidden"))
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
            .requestMatchers("/actuator/health", "/error").permitAll()
            .anyRequest().authenticated())
        .addFilterBefore(new SupabaseAuthenticationFilter(supabase), UsernamePasswordAuthenticationFilter.class)
        .build();
  }

  @Bean
  UrlBasedCorsConfigurationSource corsConfigurationSource(
      @Value("${takka.frontend-origin}") String origin) {
    var configuration = new CorsConfiguration();
    configuration.setAllowedOrigins(List.of(origin, origin.replace("localhost", "127.0.0.1")));
    configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "Idempotency-Key"));
    configuration.setAllowedMethods(List.of("GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"));
    configuration.setAllowCredentials(true);
    var source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/api/**", configuration);
    return source;
  }
}
