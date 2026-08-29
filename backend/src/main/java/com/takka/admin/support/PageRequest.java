package com.takka.admin.support;

/** A clamped page coordinate. Console links can pass anything, so every value is normalised here. */
public record PageRequest(int page, int size) {
  public static final int MAX_SIZE = 100;
  public static final int DEFAULT_SIZE = 25;

  public PageRequest {
    page = Math.max(0, page);
    size = size < 1 ? DEFAULT_SIZE : Math.min(size, MAX_SIZE);
  }

  public static PageRequest of(int page) {
    return new PageRequest(page, DEFAULT_SIZE);
  }

  public static PageRequest of(int page, int size) {
    return new PageRequest(page, size);
  }

  public int offset() {
    return page * size;
  }

  /**
   * One row beyond the page size. Fetching the extra row tells us whether a next page exists
   * without asking PostgREST for an exact count.
   */
  public int lookaheadLimit() {
    return size + 1;
  }
}
