-- Free, explainable university matching for prospective students. This is
-- deliberately rule-based: field of study carries the most weight, followed by
-- city and degree level, and every returned score has human-readable reasons.

create extension if not exists pg_trgm with schema extensions;

create index if not exists departments_name_trgm_idx
  on public.departments using gin (lower(name) extensions.gin_trgm_ops);

create index if not exists programs_name_trgm_idx
  on public.programs using gin (lower(name) extensions.gin_trgm_ops);

create index if not exists universities_city_trgm_idx
  on public.universities using gin (lower(city) extensions.gin_trgm_ops)
  where is_published and archived_at is null;

create or replace function public.recommend_universities(
  p_preferred_field text default null,
  p_preferred_city text default null,
  p_preferred_degree_level text default null,
  p_limit integer default 6
)
returns table (
  university_id uuid,
  score double precision,
  match_reasons text[]
)
language sql
stable
security invoker
set search_path = ''
as $$
  with preferences as (
    select
      nullif(trim(p_preferred_field), '') as field,
      nullif(trim(p_preferred_city), '') as city,
      nullif(trim(p_preferred_degree_level), '') as degree
  ),
  scored as (
    select
      u.id,
      case
        when pref.field is null then 0::double precision
        else coalesce(field_match.value, 0)
      end as field_score,
      case
        when pref.city is null then 0::double precision
        when lower(u.city) = lower(pref.city) then 1::double precision
        when lower(coalesce(u.region, '')) = lower(pref.city) then 0.9::double precision
        else greatest(
          extensions.similarity(lower(u.city), lower(pref.city)),
          extensions.similarity(lower(coalesce(u.region, '')), lower(pref.city))
        )::double precision
      end as city_score,
      case
        when pref.degree is null then 0::double precision
        when degree_match.matches then 1::double precision
        else 0::double precision
      end as degree_score,
      pref.field,
      pref.city,
      pref.degree
    from public.universities u
    cross join preferences pref
    left join lateral (
      select max(
        case
          when lower(candidate.name) like '%' || lower(pref.field) || '%'
          then 1::double precision
          else extensions.similarity(lower(candidate.name), lower(pref.field))::double precision
        end
      ) as value
      from (
        select d.name
        from public.departments d
        where d.university_id = u.id
        union all
        select p.name
        from public.programs p
        where p.university_id = u.id
      ) candidate
    ) field_match on pref.field is not null
    left join lateral (
      select exists (
        select 1
        from public.programs p
        where p.university_id = u.id
          and lower(p.degree_level) = lower(pref.degree)
      ) as matches
    ) degree_match on true
    where u.is_published
      and u.archived_at is null
      and (pref.field is not null or pref.city is not null or pref.degree is not null)
  ),
  ranked as (
    select
      id,
      (field_score * 0.65 + city_score * 0.20 + degree_score * 0.15) as total,
      array_remove(array[
        case when field_score >= 0.30 then 'Offers a related field of study' end,
        case when city_score >= 0.70 then 'Matches your preferred city or region' end,
        case when degree_score = 1 then 'Offers your preferred degree level' end
      ], null) as reasons
    from scored
  )
  select id, total, reasons
  from ranked
  where total > 0
  order by total desc, id
  limit greatest(1, least(coalesce(p_limit, 6), 20));
$$;

revoke all on function public.recommend_universities(text, text, text, integer)
  from public, anon;
grant execute on function public.recommend_universities(text, text, text, integer)
  to authenticated;
