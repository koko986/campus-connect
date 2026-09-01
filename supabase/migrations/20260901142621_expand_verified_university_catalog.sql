-- Expand the directory beyond the previous uniRank-only whitelist using public
-- institutions documented by Myanmar government or official university sources.
--
-- Primary sources:
--   Ministry of Education, Computer Universities directory (current in 2026)
--   https://moe.gov.mm/en/unient/cus
--
--   Ministry of Education, Education Reform Four Years report, pp. 55-64
--   https://www.moe.gov.mm/sites/default/files/Education_Reform_Four_Years.pdf
--
--   Myanmar Institute of Information Technology, current programmes
--   https://www.miit.edu.mm/about_miit_overview/
--
--   Ministry of Education Universities Research Journals (2019, 2023, 2024)
--
-- The old broader draft also contained uncertain private providers and
-- institutions whose campuses are now described as former or repurposed. Those
-- rows remain unpublished. This migration only adds institutions and academic
-- fields supported by the sources above.

with institution_seed(
  slug, name, short_name, city, region, founded_year, website_url, description, source_url
) as (
  values
    ('university-of-computer-studies-pathein', 'University of Computer Studies, Pathein', 'UCS Pathein', 'Pathein', 'Ayeyarwady Region', null::smallint, null,
     'Public computer studies university serving the Ayeyarwady Region with degree programmes in computer science and computer technology.',
     'https://moe.gov.mm/en/unient/cus'),
    ('university-of-computer-studies-hinthada', 'University of Computer Studies, Hinthada', 'UCS Hinthada', 'Hinthada', 'Ayeyarwady Region', null::smallint, null,
     'Public computer studies university in Hinthada offering degree programmes in computer science and computer technology.',
     'https://moe.gov.mm/en/unient/cus'),
    ('university-of-computer-studies-maubin', 'University of Computer Studies, Maubin', 'UCS Maubin', 'Maubin', 'Ayeyarwady Region', null::smallint, null,
     'Public computer studies university in Maubin offering degree programmes in computer science and computer technology.',
     'https://moe.gov.mm/en/unient/cus'),
    ('university-of-computer-studies-pyay', 'University of Computer Studies, Pyay', 'UCS Pyay', 'Pyay', 'Bago Region', null::smallint, null,
     'Public computer studies university in Pyay offering degree programmes in computer science and computer technology.',
     'https://moe.gov.mm/en/unient/cus'),
    ('university-of-computer-studies-taungoo', 'University of Computer Studies, Taungoo', 'UCS Taungoo', 'Taungoo', 'Bago Region', null::smallint, null,
     'Public computer studies university in Taungoo offering degree programmes in computer science and computer technology.',
     'https://moe.gov.mm/en/unient/cus'),
    ('university-of-computer-studies-hakha', 'University of Computer Studies, Hakha', 'UCS Hakha', 'Hakha', 'Chin State', null::smallint, null,
     'Public computer studies university in Hakha offering degree programmes in computer science and computer technology.',
     'https://moe.gov.mm/en/unient/cus'),
    ('university-of-computer-studies-myitkyina', 'University of Computer Studies, Myitkyina', 'UCS Myitkyina', 'Myitkyina', 'Kachin State', null::smallint, null,
     'Public computer studies university in Myitkyina offering degree programmes in computer science and computer technology.',
     'https://moe.gov.mm/en/unient/cus'),
    ('university-of-computer-studies-bhamo', 'University of Computer Studies, Bhamo', 'UCS Bhamo', 'Bhamo', 'Kachin State', null::smallint, null,
     'Public computer studies university in Bhamo offering degree programmes in computer science and computer technology.',
     'https://moe.gov.mm/en/unient/cus'),
    ('university-of-computer-studies-loikaw', 'University of Computer Studies, Loikaw', 'UCS Loikaw', 'Loikaw', 'Kayah State', null::smallint, null,
     'Public computer studies university in Loikaw offering degree programmes in computer science and computer technology.',
     'https://moe.gov.mm/en/unient/cus'),
    ('university-of-computer-studies-hpa-an', 'University of Computer Studies, Hpa-An', 'UCS Hpa-An', 'Hpa-An', 'Kayin State', null::smallint, null,
     'Public computer studies university in Hpa-An offering degree programmes in computer science and computer technology.',
     'https://moe.gov.mm/en/unient/cus'),
    ('university-of-computer-studies-magway', 'University of Computer Studies, Magway', 'UCS Magway', 'Magway', 'Magway Region', null::smallint, null,
     'Public computer studies university in Magway offering degree programmes in computer science and computer technology.',
     'https://moe.gov.mm/en/unient/cus'),
    ('university-of-computer-studies-pakokku', 'University of Computer Studies, Pakokku', 'UCS Pakokku', 'Pakokku', 'Magway Region', null::smallint, null,
     'Public computer studies university in Pakokku offering degree programmes in computer science and computer technology.',
     'https://moe.gov.mm/en/unient/cus'),
    ('university-of-computer-studies-meiktila', 'University of Computer Studies, Meiktila', 'UCS Meiktila', 'Meiktila', 'Mandalay Region', null::smallint, null,
     'Public computer studies university in Meiktila offering degree programmes in computer science and computer technology.',
     'https://moe.gov.mm/en/unient/cus'),
    ('university-of-computer-studies-thaton', 'University of Computer Studies, Thaton', 'UCS Thaton', 'Thaton', 'Mon State', null::smallint, null,
     'Public computer studies university in Thaton offering degree programmes in computer science and computer technology.',
     'https://moe.gov.mm/en/unient/cus'),
    ('university-of-computer-studies-sittwe', 'University of Computer Studies, Sittwe', 'UCS Sittwe', 'Sittwe', 'Rakhine State', null::smallint, null,
     'Public computer studies university in Sittwe offering degree programmes in computer science and computer technology.',
     'https://moe.gov.mm/en/unient/cus'),
    ('university-of-computer-studies-monywa', 'University of Computer Studies, Monywa', 'UCS Monywa', 'Monywa', 'Sagaing Region', null::smallint, null,
     'Public computer studies university in Monywa offering degree programmes in computer science and computer technology.',
     'https://moe.gov.mm/en/unient/cus'),
    ('university-of-computer-studies-kalay', 'University of Computer Studies, Kalay', 'UCS Kalay', 'Kalay', 'Sagaing Region', null::smallint, null,
     'Public computer studies university in Kalay offering degree programmes in computer science and computer technology.',
     'https://moe.gov.mm/en/unient/cus'),
    ('university-of-computer-studies-lashio', 'University of Computer Studies, Lashio', 'UCS Lashio', 'Lashio', 'Shan State', null::smallint, null,
     'Public computer studies university in Lashio offering degree programmes in computer science and computer technology.',
     'https://moe.gov.mm/en/unient/cus'),
    ('university-of-computer-studies-panglong', 'University of Computer Studies, Panglong', 'UCS Panglong', 'Panglong', 'Shan State', null::smallint, null,
     'Public computer studies university in Panglong offering degree programmes in computer science and computer technology.',
     'https://moe.gov.mm/en/unient/cus'),
    ('university-of-computer-studies-dawei', 'University of Computer Studies, Dawei', 'UCS Dawei', 'Dawei', 'Tanintharyi Region', null::smallint, null,
     'Public computer studies university in Dawei offering degree programmes in computer science and computer technology.',
     'https://moe.gov.mm/en/unient/cus'),
    ('university-of-computer-studies-myeik', 'University of Computer Studies, Myeik', 'UCS Myeik', 'Myeik', 'Tanintharyi Region', null::smallint, null,
     'Public computer studies university in Myeik offering degree programmes in computer science and computer technology.',
     'https://moe.gov.mm/en/unient/cus'),

    ('myanmar-institute-of-information-technology', 'Myanmar Institute of Information Technology', 'MIIT', 'Mandalay', 'Mandalay Region', 2015::smallint, 'https://www.miit.edu.mm/',
     'Government, not-for-profit technology institute offering engineering programmes in computer science, electronics and communications, plus postgraduate study in computer science.',
     'https://www.miit.edu.mm/about_miit_overview/'),
    ('university-of-distance-education-yangon', 'University of Distance Education, Yangon', 'UDE Yangon', 'Yangon', 'Yangon Region', null::smallint, null,
     'Public distance-learning university delivering arts and science degree programmes to students across lower Myanmar.',
     'https://www.moe.gov.mm/sites/default/files/Education_Reform_Four_Years.pdf'),
    ('university-of-distance-education-mandalay', 'University of Distance Education, Mandalay', 'UDE Mandalay', 'Mandalay', 'Mandalay Region', null::smallint, null,
     'Public distance-learning university delivering arts and science degree programmes to students across upper Myanmar.',
     'https://www.moe.gov.mm/sites/default/files/Education_Reform_Four_Years.pdf'),
    ('yenangyaung-university', 'Yenangyaung University', 'YNU', 'Yenangyaung', 'Magway Region', null::smallint, null,
     'Public arts and science university in Yenangyaung with teaching and research in the humanities and natural sciences.',
     'https://www.moe.gov.mm/sites/default/files/2024%20URJ%20Vol.15%2C%20No.%205.pdf'),
    ('taungup-university', 'Taungup University', 'TUP', 'Taungup', 'Rakhine State', null::smallint, null,
     'Public arts and science university in Taungup, upgraded from degree-college status as part of Myanmar higher-education reform.',
     'https://www.moe.gov.mm/sites/default/files/Education_Reform_Four_Years.pdf'),
    ('hakha-university', 'Hakha University', 'HKU', 'Hakha', 'Chin State', null::smallint, null,
     'Public arts and science university in Hakha, upgraded from degree-college status as part of Myanmar higher-education reform.',
     'https://www.moe.gov.mm/sites/default/files/Education_Reform_Four_Years.pdf'),
    ('mohnyin-university', 'Mohnyin University', 'MHU', 'Mohnyin', 'Kachin State', null::smallint, null,
     'Public university in Mohnyin serving students in Kachin State with arts and science study and research.',
     'https://moe.gov.mm/my/node/5428'),
    ('myingyan-university', 'Myingyan University', 'MGYU', 'Myingyan', 'Mandalay Region', null::smallint, null,
     'Public arts and science university in Myingyan with documented teaching and research in geology and zoology.',
     'https://www.moe.gov.mm/sites/default/files/ICARE%20Programme%201-1-2025%20Final%20V2%20.pdf'),
    ('mandalar-university', 'Mandalar University', 'MDLU', 'Mandalay', 'Mandalay Region', null::smallint, null,
     'Public arts and science university in Mandalay with documented teaching and research in botany and zoology.',
     'https://www.moe.gov.mm/sites/default/files/2024%20URJ%20Vol.15%2C%20No.%205.pdf')
)
insert into public.universities (
  slug, name, short_name, university_type, city, region, country_code,
  founded_year, website_url, description, is_published, data_source_url, data_verified_at
)
select
  slug,
  name,
  short_name,
  'public'::public.university_type,
  city,
  region,
  'MM',
  founded_year,
  website_url,
  description,
  true,
  source_url,
  '2026-09-01'::timestamptz
from institution_seed
on conflict (slug) do update set
  region = coalesce(public.universities.region, excluded.region),
  founded_year = coalesce(public.universities.founded_year, excluded.founded_year),
  website_url = coalesce(public.universities.website_url, excluded.website_url),
  data_source_url = excluded.data_source_url,
  data_verified_at = excluded.data_verified_at,
  is_published = true,
  archived_at = null,
  updated_at = now();

-- Regional computer universities use the two degree families documented for
-- recognized Universities of Computer Studies: B.C.Sc. and B.C.Tech.
with computer_universities(slug) as (
  values
    ('university-of-computer-studies-pathein'),
    ('university-of-computer-studies-hinthada'),
    ('university-of-computer-studies-maubin'),
    ('university-of-computer-studies-pyay'),
    ('university-of-computer-studies-taungoo'),
    ('university-of-computer-studies-hakha'),
    ('university-of-computer-studies-myitkyina'),
    ('university-of-computer-studies-bhamo'),
    ('university-of-computer-studies-loikaw'),
    ('university-of-computer-studies-hpa-an'),
    ('university-of-computer-studies-magway'),
    ('university-of-computer-studies-pakokku'),
    ('university-of-computer-studies-meiktila'),
    ('university-of-computer-studies-thaton'),
    ('university-of-computer-studies-sittwe'),
    ('university-of-computer-studies-monywa'),
    ('university-of-computer-studies-kalay'),
    ('university-of-computer-studies-lashio'),
    ('university-of-computer-studies-panglong'),
    ('university-of-computer-studies-dawei'),
    ('university-of-computer-studies-myeik')
), fields(name) as (
  values ('Computer Science'), ('Computer Technology')
)
insert into public.departments (university_id, name, source_url)
select u.id, fields.name, 'https://moe.gov.mm/en/unient/cus'
from computer_universities cu
join public.universities u on u.slug = cu.slug
cross join fields
where not exists (
  select 1
  from public.departments d
  where d.university_id = u.id and lower(d.name) = lower(fields.name)
);

with computer_universities(slug) as (
  values
    ('university-of-computer-studies-pathein'),
    ('university-of-computer-studies-hinthada'),
    ('university-of-computer-studies-maubin'),
    ('university-of-computer-studies-pyay'),
    ('university-of-computer-studies-taungoo'),
    ('university-of-computer-studies-hakha'),
    ('university-of-computer-studies-myitkyina'),
    ('university-of-computer-studies-bhamo'),
    ('university-of-computer-studies-loikaw'),
    ('university-of-computer-studies-hpa-an'),
    ('university-of-computer-studies-magway'),
    ('university-of-computer-studies-pakokku'),
    ('university-of-computer-studies-meiktila'),
    ('university-of-computer-studies-thaton'),
    ('university-of-computer-studies-sittwe'),
    ('university-of-computer-studies-monywa'),
    ('university-of-computer-studies-kalay'),
    ('university-of-computer-studies-lashio'),
    ('university-of-computer-studies-panglong'),
    ('university-of-computer-studies-dawei'),
    ('university-of-computer-studies-myeik')
), programme(department_name, name) as (
  values
    ('Computer Science', 'Bachelor of Computer Science (B.C.Sc.)'),
    ('Computer Technology', 'Bachelor of Computer Technology (B.C.Tech.)')
)
insert into public.programs (
  university_id, department_id, name, degree_level, description, source_url
)
select
  u.id,
  d.id,
  programme.name,
  'Bachelor',
  'Undergraduate degree programme offered through Myanmar''s public Universities of Computer Studies system.',
  'https://www.miit.edu.mm/masters-degree-programmes/'
from computer_universities cu
join public.universities u on u.slug = cu.slug
cross join programme
join public.departments d
  on d.university_id = u.id and lower(d.name) = lower(programme.department_name)
where not exists (
  select 1
  from public.programs p
  where p.university_id = u.id and lower(p.name) = lower(programme.name)
);

-- Current MIIT programme pages provide exact programme names and the campus
-- address. Keep these separate from the shared computer-university curriculum.
with miit_departments(name) as (
  values
    ('Computer Science and Engineering'),
    ('Electronics and Communication Engineering')
)
insert into public.departments (university_id, name, source_url)
select u.id, md.name, 'https://www.miit.edu.mm/about_miit_overview/'
from public.universities u
cross join miit_departments md
where u.slug = 'myanmar-institute-of-information-technology'
  and not exists (
    select 1
    from public.departments d
    where d.university_id = u.id and lower(d.name) = lower(md.name)
  );

with miit_programmes(department_name, name, degree_level, description, source_url) as (
  values
    ('Computer Science and Engineering', 'Bachelor of Engineering (Honours) in Computer Science and Engineering', 'Bachelor',
     'Five-year honours engineering programme in computer science and engineering.',
     'https://www.miit.edu.mm/in-admissions-bachelors-degree-programme/'),
    ('Electronics and Communication Engineering', 'Bachelor of Engineering (Honours) in Electronics and Communication Engineering', 'Bachelor',
     'Five-year honours engineering programme in electronics and communication engineering.',
     'https://www.miit.edu.mm/bachelor-of-engineering-honours-in-electronic-communications-engineering/'),
    ('Computer Science and Engineering', 'Master of Engineering in Computer Science', 'Master',
     'Graduate engineering programme in computer science with coursework, electives and advanced study.',
     'https://www.miit.edu.mm/master-of-engineering-in-computer-science/')
)
insert into public.programs (
  university_id, department_id, name, degree_level, description, source_url
)
select u.id, d.id, mp.name, mp.degree_level, mp.description, mp.source_url
from public.universities u
cross join miit_programmes mp
join public.departments d
  on d.university_id = u.id and lower(d.name) = lower(mp.department_name)
where u.slug = 'myanmar-institute-of-information-technology'
  and not exists (
    select 1
    from public.programs p
    where p.university_id = u.id and lower(p.name) = lower(mp.name)
  );

insert into public.campuses (university_id, name, city, address, source_url)
select
  u.id,
  'Main Campus',
  'Mandalay',
  '73rd Street, Ngu Shwe Wah Street, Chanmyathazi Township, Mandalay',
  'https://www.miit.edu.mm/about_miit_overview/'
from public.universities u
where u.slug = 'myanmar-institute-of-information-technology'
  and not exists (
    select 1
    from public.campuses c
    where c.university_id = u.id and lower(c.name) = 'main campus'
  );

-- University research journals identify active academic departments through
-- the affiliations of department heads and teaching staff. These rows enrich
-- the directory without inferring unlisted programmes or degree awards.
with verified_departments(slug, department_name, source_url) as (
  values
    ('mandalar-university', 'Botany', 'https://www.moe.gov.mm/sites/default/files/2023%20URJ%20Vol.14%2C%20No.%205%20%28Botany%20II%29.pdf'),
    ('mandalar-university', 'Zoology', 'https://www.moe.gov.mm/sites/default/files/2024%20URJ%20Vol.15%2C%20No.%205.pdf'),
    ('myingyan-university', 'Geology', 'https://www.moe.gov.mm/sites/default/files/ICARE%20Programme%201-1-2025%20Final%20V2%20.pdf'),
    ('myingyan-university', 'Zoology', 'https://moe.gov.mm/sites/default/files/2019%20URJ%20Vol.12%2C%20No.4%20%28zoology%29%20edited.pdf'),
    ('yenangyaung-university', 'Zoology', 'https://www.moe.gov.mm/sites/default/files/2024%20URJ%20Vol.15%2C%20No.%205.pdf'),
    ('university-of-distance-education-yangon', 'Botany', 'https://www.moe.gov.mm/sites/default/files/2023%20URJ%20Vol.14%2C%20No.%205%20%28Botany%20II%29.pdf'),
    ('university-of-distance-education-yangon', 'Zoology', 'https://www.moe.gov.mm/sites/default/files/2024%20URJ%20Vol.15%2C%20No.%205.pdf'),
    ('sagaing-university', 'Botany', 'https://www.moe.gov.mm/sites/default/files/2023%20URJ%20Vol.14%2C%20No.%205%20%28Botany%20II%29.pdf'),
    ('sittway-university', 'Botany', 'https://www.moe.gov.mm/sites/default/files/2023%20URJ%20Vol.14%2C%20No.%205%20%28Botany%20II%29.pdf'),
    ('university-of-myitkyina', 'Botany', 'https://www.moe.gov.mm/sites/default/files/2023%20URJ%20Vol.14%2C%20No.%205%20%28Botany%20II%29.pdf'),
    ('pathein-university', 'Botany', 'https://www.moe.gov.mm/sites/default/files/2023%20URJ%20Vol.14%2C%20No.%205%20%28Botany%20II%29.pdf'),
    ('pathein-university', 'Zoology', 'https://www.moe.gov.mm/sites/default/files/2024%20URJ%20Vol.15%2C%20No.%205.pdf'),
    ('panglong-university', 'Botany', 'https://www.moe.gov.mm/sites/default/files/2023%20URJ%20Vol.14%2C%20No.%205%20%28Botany%20II%29.pdf'),
    ('dagon-university', 'Botany', 'https://www.moe.gov.mm/sites/default/files/2023%20URJ%20Vol.14%2C%20No.%205%20%28Botany%20II%29.pdf'),
    ('dagon-university', 'Zoology', 'https://moe.gov.mm/sites/default/files/2019%20URJ%20Vol.12%2C%20No.4%20%28zoology%29%20edited.pdf'),
    ('university-of-kalay', 'Botany', 'https://www.moe.gov.mm/sites/default/files/2023%20URJ%20Vol.14%2C%20No.%205%20%28Botany%20II%29.pdf'),
    ('university-of-kalay', 'Zoology', 'https://moe.gov.mm/sites/default/files/2019%20URJ%20Vol.12%2C%20No.4%20%28zoology%29%20edited.pdf'),
    ('lashio-university', 'Botany', 'https://www.moe.gov.mm/sites/default/files/2023%20URJ%20Vol.14%2C%20No.%205%20%28Botany%20II%29.pdf'),
    ('taungoo-university', 'Botany', 'https://www.moe.gov.mm/sites/default/files/2023%20URJ%20Vol.14%2C%20No.%205%20%28Botany%20II%29.pdf'),
    ('hinthada-university', 'Zoology', 'https://moe.gov.mm/sites/default/files/2019%20URJ%20Vol.12%2C%20No.4%20%28zoology%29%20edited.pdf'),
    ('university-of-west-yangon', 'Zoology', 'https://moe.gov.mm/sites/default/files/2019%20URJ%20Vol.12%2C%20No.4%20%28zoology%29%20edited.pdf'),
    ('meiktila-university', 'Zoology', 'https://moe.gov.mm/sites/default/files/2019%20URJ%20Vol.12%2C%20No.4%20%28zoology%29%20edited.pdf'),
    ('university-of-pyay', 'Zoology', 'https://moe.gov.mm/sites/default/files/2019%20URJ%20Vol.12%2C%20No.4%20%28zoology%29%20edited.pdf'),
    ('university-of-east-yangon', 'Zoology', 'https://moe.gov.mm/sites/default/files/2019%20URJ%20Vol.12%2C%20No.4%20%28zoology%29%20edited.pdf'),
    ('loikaw-university', 'Zoology', 'https://moe.gov.mm/sites/default/files/2019%20URJ%20Vol.12%2C%20No.4%20%28zoology%29%20edited.pdf'),
    ('monywa-university', 'Zoology', 'https://moe.gov.mm/sites/default/files/2019%20URJ%20Vol.12%2C%20No.4%20%28zoology%29%20edited.pdf'),
    ('maubin-university', 'Zoology', 'https://moe.gov.mm/sites/default/files/2019%20URJ%20Vol.12%2C%20No.4%20%28zoology%29%20edited.pdf'),
    ('yadanabon-university', 'Zoology', 'https://moe.gov.mm/sites/default/files/2019%20URJ%20Vol.12%2C%20No.4%20%28zoology%29%20edited.pdf'),
    ('magway-university', 'Zoology', 'https://moe.gov.mm/sites/default/files/2019%20URJ%20Vol.12%2C%20No.4%20%28zoology%29%20edited.pdf')
)
insert into public.departments (university_id, name, source_url)
select u.id, vd.department_name, vd.source_url
from verified_departments vd
join public.universities u on u.slug = vd.slug
where not exists (
  select 1
  from public.departments d
  where d.university_id = u.id and lower(d.name) = lower(vd.department_name)
);
