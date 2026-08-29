package com.takka.admin.console;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;

import com.takka.config.ConsoleI18nConfig;
import java.util.List;
import java.util.Locale;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.MessageSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.context.support.ResourceBundleMessageSource;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.test.context.web.WebAppConfiguration;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.ui.ExtendedModelMap;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;

/**
 * Exercises the real {@link ConsoleI18nConfig} through a stand-in endpoint that reports one
 * translated word, so the test states the locale behaviour rather than the wording of any page.
 */
@ExtendWith(SpringExtension.class)
@ContextConfiguration(classes = ConsoleLanguageTest.TestConfig.class)
@WebAppConfiguration
class ConsoleLanguageTest {
  @Autowired private WebApplicationContext context;

  @AfterEach
  void resetLocale() {
    LocaleContextHolder.resetLocaleContext();
  }

  private MockMvc mvc() {
    return MockMvcBuilders.webAppContextSetup(context).build();
  }

  @Test
  void theConsoleAnswersInEnglishUntilAskedOtherwise() throws Exception {
    mvc().perform(get("/admin/probe")).andExpect(content().string("Overview"));
  }

  @Test
  void theLanguageParameterSwitchesTheConsoleToBurmese() throws Exception {
    mvc().perform(get("/admin/probe").param("lang", "my")).andExpect(content().string("အနှစ်ချုပ်"));
  }

  @Test
  void theChosenLanguageSurvivesLaterRequestsInTheSameSession() throws Exception {
    var mvc = mvc();
    var session = new MockHttpSession();

    mvc.perform(get("/admin/probe").param("lang", "my").session(session));

    mvc.perform(get("/admin/probe").session(session)).andExpect(content().string("အနှစ်ချုပ်"));
  }

  /** A language the console is not published in leaves the current choice alone. */
  @Test
  void anUnsupportedLanguageIsIgnored() throws Exception {
    mvc().perform(get("/admin/probe").param("lang", "fr")).andExpect(content().string("Overview"));
  }

  @Test
  void aRegionalTagStillResolvesToTheLanguage() {
    assertEquals(ConsoleLanguage.MY, ConsoleLanguage.of(Locale.forLanguageTag("my-MM")));
    assertEquals(ConsoleLanguage.EN, ConsoleLanguage.of(Locale.forLanguageTag("en-GB")));
    assertEquals(ConsoleLanguage.EN, ConsoleLanguage.of(null));
    assertEquals(ConsoleLanguage.MY, ConsoleLanguage.parse(" MY ").orElseThrow());
    assertTrue(ConsoleLanguage.parse("klingon").isEmpty());
    assertTrue(ConsoleLanguage.parse(" ").isEmpty());
  }

  /**
   * Switching language has to return the administrator to the same filtered list, otherwise the
   * toggle doubles as a way to lose your place in a long queue.
   */
  @Test
  void theSwitcherKeepsThePathAndTheCurrentFilters() {
    LocaleContextHolder.setLocale(Locale.ENGLISH);
    var request = new MockHttpServletRequest("GET", "/admin/members");
    request.setQueryString("search=ada%20lovelace&status=BLOCKED&lang=en");
    var model = new ExtendedModelMap();

    new ConsoleLayout(new ConsoleMessages(TestConfig.bundle()), request).applyLanguage(model);

    assertEquals(ConsoleLanguage.EN, model.getAttribute("language"));
    assertEquals(
        "/admin/members?search=ada%20lovelace&status=BLOCKED&lang=my", hrefFor(model, ConsoleLanguage.MY));
    assertEquals(
        "/admin/members?search=ada%20lovelace&status=BLOCKED&lang=en", hrefFor(model, ConsoleLanguage.EN));
  }

  private static String hrefFor(ExtendedModelMap model, ConsoleLanguage language) {
    @SuppressWarnings("unchecked")
    var choices = (List<LanguageChoice>) model.getAttribute("languageChoices");
    return choices.stream()
        .filter(choice -> choice.language() == language)
        .findFirst()
        .orElseThrow()
        .href();
  }

  @Configuration
  @EnableWebMvc
  @Import(ConsoleI18nConfig.class)
  static class TestConfig {
    static MessageSource bundle() {
      var messages = new ResourceBundleMessageSource();
      messages.setBasename("messages");
      messages.setDefaultEncoding("UTF-8");
      messages.setFallbackToSystemLocale(false);
      return messages;
    }

    @Bean
    MessageSource messageSource() {
      return bundle();
    }

    @Bean
    ConsoleMessages consoleMessages(MessageSource messageSource) {
      return new ConsoleMessages(messageSource);
    }

    @Bean
    Probe probe(ConsoleMessages messages) {
      return new Probe(messages);
    }
  }

  @RestController
  static class Probe {
    private final ConsoleMessages messages;

    Probe(ConsoleMessages messages) {
      this.messages = messages;
    }

    @GetMapping(path = "/admin/probe", produces = "text/plain;charset=UTF-8")
    String word() {
      return messages.get(ConsoleSection.OVERVIEW.labelKey());
    }
  }
}
