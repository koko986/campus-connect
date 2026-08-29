package com.takka.admin.support;

import com.takka.supabase.SupabaseGateway;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.StringJoiner;

/**
 * Builder for PostgREST resource queries. Keeping the URL grammar in one place means repositories
 * describe what they need instead of concatenating and escaping query strings by hand.
 */
public final class Query {
  public enum Direction {
    ASCENDING("asc"),
    DESCENDING("desc");

    private final String keyword;

    Direction(String keyword) {
      this.keyword = keyword;
    }

    String keyword() {
      return keyword;
    }
  }

  private final String table;
  private final List<String> filters = new ArrayList<>();
  private final List<String> orders = new ArrayList<>();
  private String select = "*";
  private Integer limit;
  private Integer offset;
  private String onConflict;

  private Query(String table) {
    this.table = table;
  }

  public static Query from(String table) {
    if (table == null || table.isBlank()) throw new IllegalArgumentException("A table name is required");
    return new Query(table);
  }

  public Query select(String columns) {
    this.select = columns == null || columns.isBlank() ? "*" : columns;
    return this;
  }

  public Query eq(String column, Object value) {
    return filter(column, "eq." + value);
  }

  public Query isNull(String column) {
    return filter(column, "is.null");
  }

  public Query gte(String column, Object value) {
    return filter(column, "gte." + value);
  }

  public Query in(String column, Collection<?> values) {
    return filter(column, "in.(" + join(values) + ")");
  }

  public Query notIn(String column, Collection<?> values) {
    return filter(column, "not.in.(" + join(values) + ")");
  }

  /** Case-insensitive contains-match across several columns, combined with OR. */
  public Query containsAnyOf(String term, String... columns) {
    if (term == null || term.isBlank() || columns.length == 0) return this;
    String pattern = "*" + term.trim() + "*";
    var joiner = new StringJoiner(",", "(", ")");
    for (String column : columns) joiner.add(column + ".ilike." + SupabaseGateway.encode(pattern));
    filters.add("or=" + joiner);
    return this;
  }

  public Query orderBy(String column, Direction direction) {
    orders.add(column + "." + direction.keyword());
    return this;
  }

  public Query limit(int value) {
    this.limit = value;
    return this;
  }

  public Query offset(int value) {
    this.offset = value;
    return this;
  }

  /** Requests one row more than the page size so callers can detect a following page. */
  public Query page(PageRequest request) {
    return offset(request.offset()).limit(request.lookaheadLimit());
  }

  /** Turns an insert into an upsert that merges onto the given unique column. */
  public Query upsertOn(String column) {
    this.onConflict = column;
    return this;
  }

  public String build() {
    var parameters = new ArrayList<String>();
    // Select lists are developer-authored literals; PostgREST reads the embed syntax unescaped.
    parameters.add("select=" + select);
    if (onConflict != null) parameters.add("on_conflict=" + onConflict);
    parameters.addAll(filters);
    if (!orders.isEmpty()) parameters.add("order=" + String.join(",", orders));
    if (limit != null) parameters.add("limit=" + limit);
    if (offset != null) parameters.add("offset=" + offset);
    return table + "?" + String.join("&", parameters);
  }

  @Override
  public String toString() {
    return build();
  }

  private Query filter(String column, String expression) {
    filters.add(column + "=" + expression);
    return this;
  }

  private static String join(Collection<?> values) {
    var joiner = new StringJoiner(",");
    for (Object value : values) joiner.add(String.valueOf(value));
    return joiner.toString();
  }
}
