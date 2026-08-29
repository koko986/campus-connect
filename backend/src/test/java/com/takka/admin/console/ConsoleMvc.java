package com.takka.admin.console;

import com.takka.admin.model.AdminIdentity;
import com.takka.admin.session.AdminSessionFilter;
import java.util.List;
import java.util.Locale;
import org.springframework.context.MessageSource;
import org.springframework.context.support.ResourceBundleMessageSource;
import org.springframework.mock.web.MockHttpServletRequest;
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
 *
 * <p>The real message bundle is loaded here rather than stubbed, so a flash banner or validation
 * message that names a key the bundle does not define fails the test that provoked it.
 */
final class ConsoleMvc {
  /**
   * Pass to {@code MockHttpServletRequestBuilder.locale} to read a response in Burmese. The console
   * resolves the locale per request, so setting it on the request is what a {@code ?lang=my} visit
   * amounts to by the time a controller runs.
   */
  static final Locale MYANMAR = Locale.of("my");

  private ConsoleMvc() {}

  static MessageSource messageSource() {
    var messages = new ResourceBundleMessageSource();
    messages.setBasename("messages");
    messages.setDefaultEncoding("UTF-8");
    messages.setFallbackToSystemLocale(false);
    return messages;
  }

  static ConsoleMessages consoleMessages() {
    return new ConsoleMessages(messageSource());
  }

  static ConsoleLayout layout() {
    return new ConsoleLayout(consoleMessages(), new MockHttpServletRequest("GET", "/admin"));
  }

  static MockMvc forController(Object controller) {
    var validator = new LocalValidatorFactoryBean();
    validator.setValidationMessageSource(messageSource());
    validator.afterPropertiesSet();
    return MockMvcBuilders.standaloneSetup(controller)
        .setValidator(validator)
        .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver())
        .setControllerAdvice(new ConsoleExceptionHandler(consoleMessages(), layout()))
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
