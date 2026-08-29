package com.takka.admin.support;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import java.util.stream.IntStream;
import org.junit.jupiter.api.Test;

class PageTest {
  @Test
  void clampsPageCoordinates() {
    assertEquals(0, PageRequest.of(-4).page());
    assertEquals(PageRequest.DEFAULT_SIZE, PageRequest.of(0, 0).size());
    assertEquals(PageRequest.MAX_SIZE, PageRequest.of(0, 5000).size());
  }

  @Test
  void computesOffsetAndLookahead() {
    var request = PageRequest.of(3, 20);

    assertEquals(60, request.offset());
    assertEquals(21, request.lookaheadLimit());
  }

  @Test
  void dropsTheLookaheadRowAndReportsANextPage() {
    var request = PageRequest.of(0, 3);
    List<Integer> fetched = List.of(1, 2, 3, 4);

    var page = Page.ofLookahead(fetched, request);

    assertEquals(List.of(1, 2, 3), page.items());
    assertTrue(page.hasNext());
    assertFalse(page.hasPrevious());
  }

  @Test
  void reportsNoNextPageWhenTheLookaheadRowIsAbsent() {
    var page = Page.ofLookahead(List.of(1, 2), PageRequest.of(0, 3));

    assertEquals(2, page.items().size());
    assertFalse(page.hasNext());
  }

  @Test
  void numbersRowsFromTheOffset() {
    var page = Page.ofLookahead(
        IntStream.range(0, 5).boxed().toList(), PageRequest.of(2, 5));

    assertEquals(11, page.firstRowNumber());
    assertEquals(15, page.lastRowNumber());
    assertTrue(page.hasPrevious());
    assertEquals(1, page.previousPage());
    assertEquals(3, page.nextPage());
  }

  @Test
  void anEmptyPageHasNoRowNumbers() {
    var page = Page.empty(PageRequest.of(4, 10));

    assertTrue(page.isEmpty());
    assertEquals(0, page.firstRowNumber());
  }

  @Test
  void mappingKeepsNavigationState() {
    var page = Page.ofLookahead(List.of(1, 2, 3), PageRequest.of(1, 2)).map(value -> "n" + value);

    assertEquals(List.of("n1", "n2"), page.items());
    assertTrue(page.hasNext());
    assertEquals(1, page.page());
  }
}
