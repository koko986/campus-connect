package com.takka.admin.support;

import java.util.List;
import java.util.function.Function;

/** A slice of rows plus the navigation state the console templates need. */
public record Page<T>(List<T> items, int page, int size, boolean hasNext) {
  public Page {
    items = List.copyOf(items);
  }

  /**
   * Builds a page from a lookahead result: the caller fetched {@code size + 1} rows, so a full
   * overflow list means another page follows and the surplus row is dropped.
   */
  public static <T> Page<T> ofLookahead(List<T> rows, PageRequest request) {
    boolean hasNext = rows.size() > request.size();
    return new Page<>(hasNext ? rows.subList(0, request.size()) : rows, request.page(), request.size(), hasNext);
  }

  public static <T> Page<T> empty(PageRequest request) {
    return new Page<>(List.of(), request.page(), request.size(), false);
  }

  public <R> Page<R> map(Function<T, R> mapper) {
    return new Page<>(items.stream().map(mapper).toList(), page, size, hasNext);
  }

  public boolean hasPrevious() {
    return page > 0;
  }

  public int previousPage() {
    return Math.max(0, page - 1);
  }

  public int nextPage() {
    return page + 1;
  }

  public boolean isEmpty() {
    return items.isEmpty();
  }

  public int firstRowNumber() {
    return isEmpty() ? 0 : page * size + 1;
  }

  public int lastRowNumber() {
    return page * size + items.size();
  }
}
