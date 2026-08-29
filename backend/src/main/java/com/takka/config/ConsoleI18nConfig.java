package com.takka.config;

import com.takka.admin.console.ConsoleLanguage;
import java.util.Locale;
import org.springframework.context.MessageSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.validation.Validator;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;
import org.springframework.web.servlet.LocaleResolver;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.i18n.LocaleChangeInterceptor;
import org.springframework.web.servlet.i18n.SessionLocaleResolver;

/**
 * Language selection for the console. The choice lives in the console session, which the console
 * already has, so switching language needs no cookie of its own and no database column.
 *
 * <p>The JSON API is unaffected: it renders no text of its own, and the request-scoped locale only
 * reaches code that asks for it.
 */
@Configuration
public class ConsoleI18nConfig implements WebMvcConfigurer {
  private final MessageSource messageSource;

  ConsoleI18nConfig(MessageSource messageSource) {
    this.messageSource = messageSource;
  }

  @Bean
  LocaleResolver localeResolver() {
    var resolver = new SessionLocaleResolver();
    resolver.setDefaultLocale(Locale.ENGLISH);
    return resolver;
  }

  @Bean
  LocaleChangeInterceptor localeChangeInterceptor() {
    var interceptor = new SupportedLocaleChangeInterceptor();
    interceptor.setParamName(ConsoleLanguage.PARAMETER);
    interceptor.setIgnoreInvalidLocale(true);
    return interceptor;
  }

  @Override
  public void addInterceptors(InterceptorRegistry registry) {
    registry.addInterceptor(localeChangeInterceptor());
  }

  /**
   * Replaces Boot's validator so {@code message = "{validation.key}"} resolves from the same bundle
   * as the rest of the console, instead of Hibernate Validator's own {@code ValidationMessages}.
   */
  @Bean
  LocalValidatorFactoryBean defaultValidator() {
    var validator = new LocalValidatorFactoryBean();
    validator.setValidationMessageSource(messageSource);
    return validator;
  }

  @Override
  public Validator getValidator() {
    return defaultValidator();
  }

  /** Ignores any language the console is not actually published in, rather than half-applying it. */
  private static final class SupportedLocaleChangeInterceptor extends LocaleChangeInterceptor {
    @Override
    protected Locale parseLocaleValue(String value) {
      return ConsoleLanguage.parse(value).map(ConsoleLanguage::locale).orElse(null);
    }
  }
}
