-- Normalize common registration shorthand inside the matcher so existing profiles
-- receive useful results before they next edit or save their preferences.
create or replace function public.recommend_universities_v2(
  p_preferred_field text default null,
  p_preferred_city text default null,
  p_preferred_degree_level text default null,
  p_preferred_university_type public.university_type default null,
  p_field_weight integer default 3,
  p_city_weight integer default 2,
  p_degree_weight integer default 3,
  p_type_weight integer default 1,
  p_limit integer default 12
)
returns table (
  university_id uuid, score integer, field_score integer, city_score integer,
  degree_score integer, type_score integer, match_reasons text[]
)
language sql stable security invoker set search_path = '' as $$
  with preferences as (
    select
      case
        when lower(trim(coalesce(p_preferred_field, ''))) in ('', 'any', 'all', 'no preference') then null
        when lower(trim(p_preferred_field)) in ('it', 'ict', 'information tech') then 'information technology'
        when lower(regexp_replace(trim(p_preferred_field), '[^a-zA-Z]', '', 'g')) in ('cs', 'bcsc') then 'computer science'
        else lower(trim(p_preferred_field))
      end as field,
      case
        when lower(trim(coalesce(p_preferred_city, ''))) in ('', 'any', 'all', 'no preference') then null
        else lower(trim(p_preferred_city))
      end as city,
      case
        when lower(trim(coalesce(p_preferred_degree_level, ''))) in ('', 'any', 'all', 'no preference') then null
        when lower(regexp_replace(trim(p_preferred_degree_level), '[^a-zA-Z]', '', 'g')) in ('bcsc', 'bctech')
          or lower(trim(p_preferred_degree_level)) like 'bachelor%' then 'bachelor'
        when lower(regexp_replace(trim(p_preferred_degree_level), '[^a-zA-Z]', '', 'g')) in ('mcsc', 'mctech')
          or lower(trim(p_preferred_degree_level)) like 'master%' then 'master'
        when lower(regexp_replace(trim(p_preferred_degree_level), '[^a-zA-Z]', '', 'g')) = 'phd'
          or lower(trim(p_preferred_degree_level)) like 'doctor%' then 'doctorate'
        else lower(trim(p_preferred_degree_level))
      end as degree
  ), scored as (
    select u.id,
      case when pref.field is not null and exists (
        select 1 from (
          select d.name from public.departments d where d.university_id = u.id
          union all
          select pr.name from public.programs pr where pr.university_id = u.id
        ) candidate
        where lower(candidate.name) like '%' || pref.field || '%'
          or pref.field like '%' || lower(candidate.name) || '%'
          or extensions.similarity(lower(candidate.name), pref.field) >= 0.25
      ) then greatest(1, least(p_field_weight, 5)) else 0 end as fs,
      case when pref.city is not null and
        (lower(u.city) = pref.city or lower(coalesce(u.region, '')) = pref.city
          or extensions.similarity(lower(u.city), pref.city) >= 0.5
          or extensions.similarity(lower(coalesce(u.region, '')), pref.city) >= 0.5)
        then greatest(1, least(p_city_weight, 5)) else 0 end as cs,
      case when pref.degree is not null and exists (
        select 1 from public.programs pr where pr.university_id = u.id
          and (lower(coalesce(pr.degree_level, '')) = pref.degree
            or lower(coalesce(pr.degree_level, '')) like pref.degree || ' %')
      ) then greatest(1, least(p_degree_weight, 5)) else 0 end as ds,
      case when p_preferred_university_type is not null and u.university_type = p_preferred_university_type
        then greatest(1, least(p_type_weight, 5)) else 0 end as ts,
      pref.field, pref.city, pref.degree
    from public.universities u cross join preferences pref
    where u.is_published and u.archived_at is null
  ), totals as (
    select *, fs + cs + ds + ts as total,
      greatest(1,
        case when field is not null then greatest(1, least(p_field_weight, 5)) else 0 end +
        case when city is not null then greatest(1, least(p_city_weight, 5)) else 0 end +
        case when degree is not null then greatest(1, least(p_degree_weight, 5)) else 0 end +
        case when p_preferred_university_type is not null then greatest(1, least(p_type_weight, 5)) else 0 end
      ) as possible
    from scored
  )
  select id, round(total::numeric / possible * 100)::integer,
    round(fs::numeric / possible * 100)::integer, round(cs::numeric / possible * 100)::integer,
    round(ds::numeric / possible * 100)::integer, round(ts::numeric / possible * 100)::integer,
    array_remove(array[
      case when fs > 0 then 'field' end, case when cs > 0 then 'city' end,
      case when ds > 0 then 'degree' end, case when ts > 0 then 'type' end
    ], null)
  from totals where total > 0 order by total desc, id
  limit greatest(1, least(coalesce(p_limit, 12), 30));
$$;

revoke all on function public.recommend_universities_v2(
  text, text, text, public.university_type, integer, integer, integer, integer, integer
) from public, anon;
grant execute on function public.recommend_universities_v2(
  text, text, text, public.university_type, integer, integer, integer, integer, integer
) to authenticated;
