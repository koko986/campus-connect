package com.takka.admin.console;

import com.takka.admin.model.AdminIdentity;
import com.takka.admin.session.AdminSessionFilter;
import java.util.List;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;

/**
 * Standalone MockMvc wiring for the console controllers. The security chain is exercised separately
 * in {@link ConsoleSecurityTest}; these tests focus on binding, validation, redirects, and flashes.
 */
final class ConsoleMvc {
  private ConsoleMvc() {}

  static MockMvc forController(Object controller) {
    var validator = new LocalValidatorFactoryBean();
    validator.afterPropertiesSet();
    return MockMvcBuilders.standaloneSetup(controller)
        .setValidator(validator)
        .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver())
        .setControllerAdvice(new ConsoleExceptionHandler())
        .build();
  }

  /** Puts an administrator in the security context so {@code @AuthenticationPrincipal} resolves. */
  static void signIn(AdminIdentity administrator) {
    var authentication = new UsernamePasswordAuthenticationToken(
        administrator,
        null,
        List.of(
            new SimpleGrantedAuthority(AdminSessionFilter.ADMIN_AUTHORITY),
            new SimpleGrantedAuthority(administrator.role().authority())));
    SecurityContextHolder.getContext().setAuthentication(authentication);
  }

  static void signOut() {
    SecurityContextHolder.clearContext();
  }
}
