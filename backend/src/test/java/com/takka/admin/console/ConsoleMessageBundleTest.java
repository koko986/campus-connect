package com.takka.admin.console;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Properties;
import java.util.Set;
import java.util.TreeSet;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;

/**
 * Keeps the two bundles honest about each other. English is the reference: a key added there without
 * a Burmese translation would otherwise fall back silently and print English inside a Burmese page.
 */
class ConsoleMessageBundleTest {
  private static final Pattern PLACEHOLDER = Pattern.compile("\\{(\\d+)}");

  /** A literal Thymeleaf key, {@code #{field.slug}}. Keys built from an expression are skipped. */
  private static final Pattern TEMPLATE_KEY = Pattern.compile("#\\{([A-Za-z][\\w.]*)}");

  private static final Path RESOURCES = Path.of("src/main/resources");

  private final Properties english = bundle("messages.properties");
  private final Properties myanmar = bundle("messages_my.properties");

  /**
   * Read from the source tree rather than the classpath. This test compares what is written here
   * against the templates beside it, and an incremental build that copied one bundle but not the
   * other would otherwise fail the test with a difference nobody had introduced.
   */
  private static Properties bundle(String name) {
    var properties = new Properties();
    try (var reader = Files.newBufferedReader(RESOURCES.resolve(name), StandardCharsets.UTF_8)) {
      properties.load(reader);
    } catch (IOException unreadable) {
      throw new IllegalStateException("Could not read " + name, unreadable);
    }
    return properties;
  }

  @Test
  void bothBundlesDefineExactlyTheSameKeys() {
    assertEquals(new TreeSet<>(english.stringPropertyNames()), new TreeSet<>(myanmar.stringPropertyNames()));
  }

  @Test
  void theBundlesAreNotEmpty() {
    assertTrue(english.size() > 200, "Expected the console bundle to cover the whole console");
  }

  @Test
  void noTranslationIsLeftBlank() {
    assertEquals(List.of(), blankKeysIn(english));
    assertEquals(List.of(), blankKeysIn(myanmar));
  }

  /**
   * A translation that drops or renumbers an argument would render a message missing the name, count
   * or status it was written to carry, which MessageFormat does not complain about.
   */
  @Test
  void everyTranslationKeepsTheArgumentsOfItsEnglishOriginal() {
    var mismatched = new ArrayList<String>();
    for (String key : new TreeSet<>(english.stringPropertyNames())) {
      Set<String> expected = placeholdersIn(english.getProperty(key));
      Set<String> actual = placeholdersIn(myanmar.getProperty(key, ""));
      if (!expected.equals(actual)) mismatched.add(key + " expected " + expected + " but had " + actual);
    }
    assertEquals(List.of(), mismatched);
  }

  /** Burmese must be written in the Myanmar block, which is the simplest check against Zawgyi-only text. */
  @Test
  void theMyanmarBundleIsWrittenInMyanmarScript() {
    var latinOnly = new ArrayList<String>();
    for (String key : new TreeSet<>(myanmar.stringPropertyNames())) {
      String value = myanmar.getProperty(key);
      if (!value.codePoints().anyMatch(ConsoleMessageBundleTest::isMyanmar)) latinOnly.add(key);
    }
    assertEquals(untranslatableKeys(), latinOnly);
  }

  /**
   * The few values that stay in Latin script on purpose: the product name, an em dash, and the two
   * technical terms a Myanmar administrator reads in English everywhere else in the stack.
   */
  private static List<String> untranslatableKeys() {
    return List.of(
        "console.documentTitle", "field.degreeLevelPlaceholder", "field.slug", "time.age.unknown");
  }

  /**
   * The controller tests drive standalone MockMvc, which never renders a view, so a mistyped key in
   * a template would reach a reader as {@code ??field.slgu_my??} with nothing failing first.
   */
  @Test
  void everyKeyTheTemplatesAskForExists() throws IOException {
    var missing = new TreeSet<String>();
    try (Stream<Path> templates = Files.walk(RESOURCES.resolve("templates"))) {
      for (Path template : templates.filter(path -> path.toString().endsWith(".html")).toList()) {
        Matcher matcher = TEMPLATE_KEY.matcher(Files.readString(template, StandardCharsets.UTF_8));
        while (matcher.find()) {
          String key = matcher.group(1);
          if (!english.containsKey(key)) missing.add(key + " in " + template.getFileName());
        }
      }
    }
    assertEquals(Set.of(), missing);
  }

  /**
   * The counterpart: a key the console no longer shows anywhere is a key nobody keeps translated.
   * Enum keys are assembled at runtime, in Java as {@code "enum.role." + name()} and in Thymeleaf as
   * {@code #messages.msg('enum.photoStatus.' + ...)}, so a key also counts as used when the sources
   * quote a dotted prefix of it in either language's quoting style.
   */
  @Test
  void everyKeyTheBundleDefinesIsUsedSomewhere() throws IOException {
    String sources;
    try (Stream<Path> files = Files.walk(Path.of("src/main"))) {
      var text = new StringBuilder();
      for (Path file : files.filter(Files::isRegularFile).toList()) {
        if (file.toString().endsWith(".properties")) continue;
        text.append(Files.readString(file, StandardCharsets.UTF_8)).append('\n');
      }
      sources = text.toString();
    }

    var unused = new TreeSet<String>();
    for (String key : english.stringPropertyNames()) {
      if (!sources.contains(key) && !isBuiltFromAQuotedPrefix(key, sources)) unused.add(key);
    }
    assertEquals(Set.of(), unused);
  }

  private static boolean isBuiltFromAQuotedPrefix(String key, String sources) {
    for (int dot = key.indexOf('.'); dot >= 0; dot = key.indexOf('.', dot + 1)) {
      String prefix = key.substring(0, dot + 1);
      if (sources.contains('"' + prefix + '"') || sources.contains('\'' + prefix + '\'')) return true;
    }
    return false;
  }

  private static boolean isMyanmar(int codePoint) {
    return Character.UnicodeBlock.of(codePoint) == Character.UnicodeBlock.MYANMAR;
  }

  private static List<String> blankKeysIn(Properties bundle) {
    return new TreeSet<>(bundle.stringPropertyNames())
        .stream().filter(key -> bundle.getProperty(key).isBlank()).toList();
  }

  private static Set<String> placeholdersIn(String message) {
    var found = new TreeSet<String>();
    Matcher matcher = PLACEHOLDER.matcher(message);
    while (matcher.find()) found.add(matcher.group(1));
    return found;
  }
}
