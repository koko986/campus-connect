-- ---------------------------------------------------------------------------
-- Myanmar university directory
--
-- Seeds the degree-granting higher education institutions of Myanmar so the
-- catalog stops being a handful of demo rows. Until now no migration seeded
-- universities at all, so the live rows existed only in the remote database
-- with no reproducible artifact behind them.
--
-- Source: https://en.wikipedia.org/wiki/List_of_universities_in_Myanmar
-- (CC BY-SA), whose state and region headings populate the previously empty
-- `region` column. Non-degree entries on that page -- learning centres,
-- technical high schools, vocational training centres and two-year education
-- colleges -- are deliberately excluded.
--
-- `founded_year` and `website_url` are only populated where the value is
-- known with confidence. A NULL here means "not established", not "none".
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- Seed data
--
-- The upsert keys on `slug` and only backfills columns that are still NULL, so
-- re-running never clobbers data curated later through the admin console. Rows
-- that already exist keep their `name` and `short_name`: both are unique, and
-- rewriting them here would risk colliding with a different row.
-- ---------------------------------------------------------------------------

with seed(
  slug, name, short_name, university_type, city, region, founded_year, website_url, description
) as (
  values
    -- Ayeyarwady Region ----------------------------------------------------
    ('pathein-university', 'Pathein University', 'PATU', 'public', 'Pathein', 'Ayeyarwady Region', 1977::smallint, null,
     'Public arts and science university serving the Ayeyarwady Region, with undergraduate and postgraduate degrees across the humanities, social sciences and natural sciences.'),
    ('hinthada-university', 'Hinthada University', 'HTU', 'public', 'Hinthada', 'Ayeyarwady Region', 1999::smallint, null,
     'Public arts and science university in Hinthada, offering bachelor''s and master''s degrees in the humanities and natural sciences.'),
    ('maubin-university', 'Maubin University', 'MBU', 'public', 'Maubin', 'Ayeyarwady Region', 1999::smallint, null,
     'Public arts and science university in Maubin, serving the southern Ayeyarwady delta with undergraduate degrees in arts and sciences.'),
    ('university-of-computer-studies-pathein', 'University of Computer Studies, Pathein', 'UCS Pathein', 'public', 'Pathein', 'Ayeyarwady Region', null, null,
     'Public computer studies university awarding degrees in computer science and computer technology.'),
    ('university-of-computer-studies-hinthada', 'University of Computer Studies, Hinthada', 'UCS Hinthada', 'public', 'Hinthada', 'Ayeyarwady Region', null, null,
     'Public computer studies university awarding degrees in computer science and computer technology.'),
    ('university-of-computer-studies-maubin', 'University of Computer Studies, Maubin', 'UCS Maubin', 'public', 'Maubin', 'Ayeyarwady Region', null, null,
     'Public computer studies university awarding degrees in computer science and computer technology.'),
    ('technological-university-pathein', 'Technological University, Pathein', 'TU Pathein', 'public', 'Pathein', 'Ayeyarwady Region', null, null,
     'Public engineering university awarding bachelor''s degrees across the core engineering disciplines.'),
    ('technological-university-hinthada', 'Technological University, Hinthada', 'TU Hinthada', 'public', 'Hinthada', 'Ayeyarwady Region', null, null,
     'Public engineering university awarding bachelor''s degrees across the core engineering disciplines.'),
    ('technological-university-maubin', 'Technological University, Maubin', 'TU Maubin', 'public', 'Maubin', 'Ayeyarwady Region', null, null,
     'Public engineering university awarding bachelor''s degrees across the core engineering disciplines.'),

    -- Bago Region ----------------------------------------------------------
    ('bago-university', 'Bago University', 'BGU', 'public', 'Bago', 'Bago Region', 1999::smallint, null,
     'Public arts and science university in Bago, offering undergraduate and postgraduate degrees in the humanities and sciences.'),
    ('pyay-university', 'Pyay University', 'PYU', 'public', 'Pyay', 'Bago Region', 1999::smallint, null,
     'Public arts and science university in Pyay, serving the northern Bago Region.'),
    ('taungoo-university', 'Taungoo University', 'TGU', 'public', 'Taungoo', 'Bago Region', 1999::smallint, null,
     'Public arts and science university in Taungoo, offering undergraduate degrees in the humanities and natural sciences.'),
    ('pyay-technological-university', 'Pyay Technological University', 'PYTU', 'public', 'Pyay', 'Bago Region', null, null,
     'Public engineering university in Pyay awarding bachelor''s and master''s degrees in engineering.'),
    ('university-of-computer-studies-pyay', 'University of Computer Studies, Pyay', 'UCS Pyay', 'public', 'Pyay', 'Bago Region', null, null,
     'Public computer studies university awarding degrees in computer science and computer technology.'),
    ('university-of-computer-studies-taungoo', 'University of Computer Studies, Taungoo', 'UCS Taungoo', 'public', 'Taungoo', 'Bago Region', null, null,
     'Public computer studies university awarding degrees in computer science and computer technology.'),
    ('technological-university-taungoo', 'Technological University, Taungoo', 'TU Taungoo', 'public', 'Taungoo', 'Bago Region', null, null,
     'Public engineering university awarding bachelor''s degrees across the core engineering disciplines.'),

    -- Chin State -----------------------------------------------------------
    ('chin-christian-university', 'Chin Christian University', 'CCU', 'private', 'Hakha', 'Chin State', 1978::smallint, null,
     'Private Christian liberal arts university in Hakha offering undergraduate degrees in theology, education and the liberal arts.'),

    -- Kachin State ---------------------------------------------------------
    ('myitkyina-university', 'Myitkyina University', 'MYKU', 'public', 'Myitkyina', 'Kachin State', 1979::smallint, null,
     'Public arts and science university in Myitkyina, the principal university of Kachin State.'),
    ('bhamo-university', 'Bhamo University', 'BMU', 'public', 'Bhamo', 'Kachin State', 1999::smallint, null,
     'Public arts and science university in Bhamo, offering undergraduate degrees in the humanities and sciences.'),
    ('university-of-computer-studies-myitkyina', 'University of Computer Studies, Myitkyina', 'UCS Myitkyina', 'public', 'Myitkyina', 'Kachin State', null, null,
     'Public computer studies university awarding degrees in computer science and computer technology.'),
    ('university-of-computer-studies-bhamo', 'University of Computer Studies, Bhamo', 'UCS Bhamo', 'public', 'Bhamo', 'Kachin State', null, null,
     'Public computer studies university awarding degrees in computer science and computer technology.'),
    ('technological-university-myitkyina', 'Technological University, Myitkyina', 'TU Myitkyina', 'public', 'Myitkyina', 'Kachin State', null, null,
     'Public engineering university awarding bachelor''s degrees across the core engineering disciplines.'),
    ('technological-university-bhamo', 'Technological University, Bhamo', 'TU Bhamo', 'public', 'Bhamo', 'Kachin State', null, null,
     'Public engineering university awarding bachelor''s degrees across the core engineering disciplines.'),

    -- Kayah State ----------------------------------------------------------
    ('loikaw-university', 'Loikaw University', 'LKU', 'public', 'Loikaw', 'Kayah State', 1999::smallint, null,
     'Public arts and science university in Loikaw, the principal university of Kayah State.'),
    ('university-of-computer-studies-loikaw', 'University of Computer Studies, Loikaw', 'UCS Loikaw', 'public', 'Loikaw', 'Kayah State', null, null,
     'Public computer studies university awarding degrees in computer science and computer technology.'),
    ('technological-university-loikaw', 'Technological University, Loikaw', 'TU Loikaw', 'public', 'Loikaw', 'Kayah State', null, null,
     'Public engineering university awarding bachelor''s degrees across the core engineering disciplines.'),

    -- Kayin State ----------------------------------------------------------
    ('hpa-an-university', 'Hpa-An University', 'HPU', 'public', 'Hpa-An', 'Kayin State', 1999::smallint, null,
     'Public arts and science university in Hpa-An, the principal university of Kayin State.'),
    ('university-of-computer-studies-hpa-an', 'University of Computer Studies, Hpa-An', 'UCS Hpa-An', 'public', 'Hpa-An', 'Kayin State', null, null,
     'Public computer studies university awarding degrees in computer science and computer technology.'),
    ('technological-university-hpa-an', 'Technological University, Hpa-An', 'TU Hpa-An', 'public', 'Hpa-An', 'Kayin State', null, null,
     'Public engineering university awarding bachelor''s degrees across the core engineering disciplines.'),

    -- Magway Region --------------------------------------------------------
    ('magway-university', 'Magway University', 'MGU', 'public', 'Magway', 'Magway Region', 1999::smallint, null,
     'Public arts and science university in Magway, offering undergraduate and postgraduate degrees in the humanities and sciences.'),
    ('pakokku-university', 'Pakokku University', 'PKU', 'public', 'Pakokku', 'Magway Region', 1999::smallint, null,
     'Public arts and science university in Pakokku, serving the northern Magway Region.'),
    ('yenangyaung-university', 'Yenangyaung University', 'YNU', 'public', 'Yenangyaung', 'Magway Region', null, null,
     'Public arts and science university in Yenangyaung offering undergraduate degrees in the humanities and sciences.'),
    ('university-of-medicine-magway', 'University of Medicine, Magway', 'UM Magway', 'public', 'Magway', 'Magway Region', 2000::smallint, null,
     'Public medical university under the Ministry of Health, training physicians and awarding postgraduate medical degrees.'),
    ('university-of-community-health-magway', 'University of Community Health, Magway', 'UCH Magway', 'public', 'Magway', 'Magway Region', null, null,
     'Public health sciences university training community health professionals for rural and township health services.'),
    ('university-of-computer-studies-magway', 'University of Computer Studies, Magway', 'UCS Magway', 'public', 'Magway', 'Magway Region', null, null,
     'Public computer studies university awarding degrees in computer science and computer technology.'),
    ('university-of-computer-studies-pakokku', 'University of Computer Studies, Pakokku', 'UCS Pakokku', 'public', 'Pakokku', 'Magway Region', null, null,
     'Public computer studies university awarding degrees in computer science and computer technology.'),
    ('technological-university-magway', 'Technological University, Magway', 'TU Magway', 'public', 'Magway', 'Magway Region', null, null,
     'Public engineering university awarding bachelor''s degrees across the core engineering disciplines.'),
    ('technological-university-pakokku', 'Technological University, Pakokku', 'TU Pakokku', 'public', 'Pakokku', 'Magway Region', null, null,
     'Public engineering university awarding bachelor''s degrees across the core engineering disciplines.'),

    -- Mandalay Region ------------------------------------------------------
    ('mandalay-university', 'Mandalay University', 'MU', 'public', 'Mandalay', 'Mandalay Region', 1925::smallint, 'https://www.mu.edu.mm/',
     'One of Myanmar''s oldest and largest universities, offering a full range of arts and science degrees from bachelor''s through doctoral level.'),
    ('yadanabon-university', 'Yadanabon University', 'YDU', 'public', 'Amarapura', 'Mandalay Region', 2001::smallint, null,
     'Public arts and science university near Mandalay, offering undergraduate and postgraduate degrees in the humanities and sciences.'),
    ('kyaukse-university', 'Kyaukse University', 'KSU', 'public', 'Kyaukse', 'Mandalay Region', 1999::smallint, null,
     'Public arts and science university in Kyaukse offering undergraduate degrees in the humanities and natural sciences.'),
    ('meiktila-university', 'Meiktila University', 'MKU', 'public', 'Meiktila', 'Mandalay Region', 1999::smallint, null,
     'Public arts and science university in Meiktila offering undergraduate degrees in the humanities and natural sciences.'),
    ('meiktila-university-of-economics', 'Meiktila University of Economics', 'MUE', 'public', 'Meiktila', 'Mandalay Region', 1997::smallint, null,
     'Public economics university awarding degrees in economics, commerce, statistics and business management.'),
    ('mandalay-technological-university', 'Mandalay Technological University', 'MTU', 'public', 'Patheingyi', 'Mandalay Region', 1991::smallint, null,
     'Leading public engineering university in upper Myanmar, awarding bachelor''s, master''s and doctoral degrees in engineering.'),
    ('university-of-computer-studies-mandalay', 'University of Computer Studies, Mandalay', 'UCSM', 'public', 'Mandalay', 'Mandalay Region', 1997::smallint, null,
     'Leading public computer studies university in upper Myanmar, awarding degrees in computer science and computer technology.'),
    ('university-of-medicine-mandalay', 'University of Medicine, Mandalay', 'UM Mandalay', 'public', 'Mandalay', 'Mandalay Region', 1954::smallint, null,
     'Public medical university under the Ministry of Health, training physicians and awarding postgraduate medical degrees.'),
    ('university-of-dental-medicine-mandalay', 'University of Dental Medicine, Mandalay', 'UDM Mandalay', 'public', 'Mandalay', 'Mandalay Region', null, null,
     'Public dental university under the Ministry of Health, awarding the Bachelor of Dental Surgery and postgraduate dental degrees.'),
    ('university-of-pharmacy-mandalay', 'University of Pharmacy, Mandalay', 'UP Mandalay', 'public', 'Mandalay', 'Mandalay Region', null, null,
     'Public pharmacy university under the Ministry of Health, awarding undergraduate and postgraduate degrees in pharmaceutical science.'),
    ('university-of-medical-technology-mandalay', 'University of Medical Technology, Mandalay', 'UMT Mandalay', 'public', 'Mandalay', 'Mandalay Region', null, null,
     'Public university training medical laboratory, radiography and physiotherapy professionals.'),
    ('university-of-nursing-mandalay', 'University of Nursing, Mandalay', 'UN Mandalay', 'public', 'Mandalay', 'Mandalay Region', null, null,
     'Public nursing university under the Ministry of Health, awarding undergraduate and postgraduate nursing degrees.'),
    ('university-of-traditional-medicine-mandalay', 'University of Traditional Medicine, Mandalay', 'UTM Mandalay', 'public', 'Mandalay', 'Mandalay Region', 2001::smallint, null,
     'Public university dedicated to Myanmar traditional medicine, awarding the Bachelor of Myanmar Traditional Medicine.'),
    ('university-of-foreign-languages-mandalay', 'University of Foreign Languages, Mandalay', 'UFL Mandalay', 'public', 'Mandalay', 'Mandalay Region', 1997::smallint, null,
     'Public university specialising in modern language degrees including English, Chinese, Japanese, French and Korean.'),
    ('national-university-of-arts-and-culture-mandalay', 'National University of Arts and Culture, Mandalay', 'NUAC Mandalay', 'public', 'Mandalay', 'Mandalay Region', 1993::smallint, null,
     'Public university for the performing and visual arts, awarding degrees in music, dramatic art, painting and sculpture.'),
    ('university-of-distance-education-mandalay', 'University of Distance Education, Mandalay', 'UDE Mandalay', 'public', 'Mandalay', 'Mandalay Region', null, null,
     'Public distance learning university delivering arts and science degrees to students across upper Myanmar.'),
    ('myanmar-aerospace-engineering-university', 'Myanmar Aerospace Engineering University', 'MAEU', 'public', 'Meiktila', 'Mandalay Region', 2002::smallint, null,
     'Public specialist university awarding degrees in aerospace, aeronautical, avionics and propulsion engineering.'),
    ('myanmar-institute-of-information-technology', 'Myanmar Institute of Information Technology', 'MIIT', 'public', 'Mandalay', 'Mandalay Region', 2015::smallint, null,
     'Public information technology institute delivering computer science and engineering degrees in collaboration with Indian partner institutes.'),
    ('technological-university-kyaukse', 'Technological University, Kyaukse', 'TU Kyaukse', 'public', 'Kyaukse', 'Mandalay Region', null, null,
     'Public engineering university awarding bachelor''s degrees across the core engineering disciplines.'),
    ('technological-university-meiktila', 'Technological University, Meiktila', 'TU Meiktila', 'public', 'Meiktila', 'Mandalay Region', null, null,
     'Public engineering university awarding bachelor''s degrees across the core engineering disciplines.'),
    ('university-of-computer-studies-meiktila', 'University of Computer Studies, Meiktila', 'UCS Meiktila', 'public', 'Meiktila', 'Mandalay Region', null, null,
     'Public computer studies university awarding degrees in computer science and computer technology.'),
    ('university-of-technology-yadanabon-cyber-city', 'University of Technology, Yadanabon Cyber City', 'UTYCC', 'public', 'Pyin Oo Lwin', 'Mandalay Region', 2008::smallint, null,
     'Public technology university in Yadanabon Cyber City awarding engineering and information technology degrees.'),
    ('defence-services-academy', 'Defence Services Academy', 'DSA', 'public', 'Pyin Oo Lwin', 'Mandalay Region', 1955::smallint, null,
     'Military academy commissioning officers for the Myanmar armed forces while awarding accredited bachelor''s degrees.'),
    ('defence-services-technological-academy', 'Defence Services Technological Academy', 'DSTA', 'public', 'Pyin Oo Lwin', 'Mandalay Region', 1994::smallint, null,
     'Military engineering academy awarding bachelor''s degrees in engineering to officer cadets.'),
    ('state-pariyatti-sasana-university-mandalay', 'State Pariyatti Sasana University, Mandalay', 'SPSU Mandalay', 'public', 'Mandalay', 'Mandalay Region', 1986::smallint, null,
     'State Buddhist university awarding degrees in Pariyatti Buddhist studies, Pali language and Buddhist philosophy.'),

    -- Nay Pyi Taw Union Territory ------------------------------------------
    ('yezin-agricultural-university', 'Yezin Agricultural University', 'YAU', 'public', 'Yezin', 'Nay Pyi Taw Union Territory', 1924::smallint, null,
     'Myanmar''s principal agricultural university, awarding bachelor''s, master''s and doctoral degrees in agricultural science.'),
    ('university-of-veterinary-science-yezin', 'University of Veterinary Science, Yezin', 'UVS Yezin', 'public', 'Yezin', 'Nay Pyi Taw Union Territory', 1966::smallint, null,
     'Public veterinary university awarding the Bachelor of Veterinary Science and postgraduate degrees in animal health.'),
    ('university-of-forestry-and-environmental-science-yezin', 'University of Forestry and Environmental Science, Yezin', 'UFES Yezin', 'public', 'Yezin', 'Nay Pyi Taw Union Territory', 1992::smallint, null,
     'Public university awarding degrees in forestry, environmental science and natural resource management.'),

    -- Mon State ------------------------------------------------------------
    ('mawlamyine-university', 'Mawlamyine University', 'MLU', 'public', 'Mawlamyine', 'Mon State', 1953::smallint, null,
     'Public arts and science university in Mawlamyine, the principal university of Mon State and southeastern Myanmar.'),
    ('university-of-computer-studies-thaton', 'University of Computer Studies, Thaton', 'UCS Thaton', 'public', 'Thaton', 'Mon State', null, null,
     'Public computer studies university awarding degrees in computer science and computer technology.'),
    ('technological-university-mawlamyine', 'Technological University, Mawlamyine', 'TU Mawlamyine', 'public', 'Mawlamyine', 'Mon State', null, null,
     'Public engineering university awarding bachelor''s degrees across the core engineering disciplines.'),

    -- Rakhine State --------------------------------------------------------
    ('sittway-university', 'Sittway University', 'STU', 'public', 'Sittwe', 'Rakhine State', 1976::smallint, null,
     'Public arts and science university in Sittwe, the principal university of Rakhine State.'),
    ('taungup-university', 'Taungup University', 'TUP', 'public', 'Taungup', 'Rakhine State', null, null,
     'Public arts and science university in Taungup offering undergraduate degrees in the humanities and sciences.'),
    ('arakan-national-university', 'Arakan National University', 'ANU', 'private', 'Sittwe', 'Rakhine State', null, null,
     'Private university in Sittwe offering undergraduate programmes to students in Rakhine State.'),
    ('university-of-computer-studies-sittwe', 'University of Computer Studies, Sittwe', 'UCS Sittwe', 'public', 'Sittwe', 'Rakhine State', null, null,
     'Public computer studies university awarding degrees in computer science and computer technology.'),
    ('technological-university-sittwe', 'Technological University, Sittwe', 'TU Sittwe', 'public', 'Sittwe', 'Rakhine State', null, null,
     'Public engineering university awarding bachelor''s degrees across the core engineering disciplines.'),
    ('technological-university-kyaukpyu', 'Technological University, Kyaukpyu', 'TU Kyaukpyu', 'public', 'Kyaukpyu', 'Rakhine State', null, null,
     'Public engineering university awarding bachelor''s degrees across the core engineering disciplines.'),

    -- Sagaing Region -------------------------------------------------------
    ('sagaing-university', 'Sagaing University', 'SGU', 'public', 'Sagaing', 'Sagaing Region', 1977::smallint, null,
     'Public arts and science university in Sagaing offering undergraduate and postgraduate degrees in the humanities and sciences.'),
    ('monywa-university', 'Monywa University', 'MWU', 'public', 'Monywa', 'Sagaing Region', 1999::smallint, null,
     'Public arts and science university in Monywa offering undergraduate degrees in the humanities and natural sciences.'),
    ('shwebo-university', 'Shwebo University', 'SBU', 'public', 'Shwebo', 'Sagaing Region', 1999::smallint, null,
     'Public arts and science university in Shwebo offering undergraduate degrees in the humanities and natural sciences.'),
    ('university-of-kalay', 'University of Kalay', 'UKL', 'public', 'Kalay', 'Sagaing Region', 1999::smallint, null,
     'Public arts and science university in Kalay serving the Chin hills and northwestern Sagaing Region.'),
    ('monywa-university-of-economics', 'Monywa University of Economics', 'MWUE', 'public', 'Monywa', 'Sagaing Region', 1998::smallint, null,
     'Public economics university awarding degrees in economics, commerce, statistics and business management.'),
    ('sagaing-university-of-education', 'Sagaing University of Education', 'SUOE', 'public', 'Sagaing', 'Sagaing Region', 2007::smallint, null,
     'Public university of education preparing secondary school teachers and awarding postgraduate degrees in education.'),
    ('university-of-co-operative-and-management-sagaing', 'University of Co-operative and Management, Sagaing', 'UCM Sagaing', 'public', 'Sagaing', 'Sagaing Region', null, null,
     'Public university awarding degrees in co-operative studies, management and development economics.'),
    ('university-for-the-development-of-national-races', 'University for the Development of the National Races of the Union', 'UDNR', 'public', 'Sagaing', 'Sagaing Region', 1964::smallint, null,
     'Public university preparing teachers and administrators drawn from Myanmar''s ethnic nationalities.'),
    ('university-of-computer-studies-monywa', 'University of Computer Studies, Monywa', 'UCS Monywa', 'public', 'Monywa', 'Sagaing Region', null, null,
     'Public computer studies university awarding degrees in computer science and computer technology.'),
    ('university-of-computer-studies-kalay', 'University of Computer Studies, Kalay', 'UCS Kalay', 'public', 'Kalay', 'Sagaing Region', null, null,
     'Public computer studies university awarding degrees in computer science and computer technology.'),
    ('technological-university-sagaing', 'Technological University, Sagaing', 'TU Sagaing', 'public', 'Sagaing', 'Sagaing Region', null, null,
     'Public engineering university awarding bachelor''s degrees across the core engineering disciplines.'),
    ('technological-university-monywa', 'Technological University, Monywa', 'TU Monywa', 'public', 'Monywa', 'Sagaing Region', null, null,
     'Public engineering university awarding bachelor''s degrees across the core engineering disciplines.'),
    ('technological-university-kalay', 'Technological University, Kalay', 'TU Kalay', 'public', 'Kalay', 'Sagaing Region', null, null,
     'Public engineering university awarding bachelor''s degrees across the core engineering disciplines.'),

    -- Shan State -----------------------------------------------------------
    ('taunggyi-university', 'Taunggyi University', 'TYU', 'public', 'Taunggyi', 'Shan State', 1977::smallint, null,
     'Public arts and science university in Taunggyi, the principal university of Shan State.'),
    ('lashio-university', 'Lashio University', 'LSU', 'public', 'Lashio', 'Shan State', 1999::smallint, null,
     'Public arts and science university in Lashio serving northern Shan State.'),
    ('kyaingtong-university', 'Kyaingtong University', 'KTU', 'public', 'Kyaingtong', 'Shan State', 1999::smallint, null,
     'Public arts and science university in Kyaingtong serving eastern Shan State.'),
    ('panglong-university', 'Panglong University', 'PLU', 'public', 'Panglong', 'Shan State', null, null,
     'Public arts and science university in Panglong offering undergraduate degrees in the humanities and sciences.'),
    ('university-of-medicine-taunggyi', 'University of Medicine, Taunggyi', 'UM Taunggyi', 'public', 'Taunggyi', 'Shan State', null, null,
     'Public medical university under the Ministry of Health, training physicians for Shan State and the eastern regions.'),
    ('shan-state-buddhist-university', 'Shan State Buddhist University', 'SSBU', 'private', 'Taunggyi', 'Shan State', 2004::smallint, null,
     'Buddhist university in Taunggyi awarding degrees in Buddhist studies, Pali and comparative religion.'),
    ('university-of-computer-studies-taunggyi', 'University of Computer Studies, Taunggyi', 'UCS Taunggyi', 'public', 'Taunggyi', 'Shan State', null, null,
     'Public computer studies university awarding degrees in computer science and computer technology.'),
    ('university-of-computer-studies-lashio', 'University of Computer Studies, Lashio', 'UCS Lashio', 'public', 'Lashio', 'Shan State', null, null,
     'Public computer studies university awarding degrees in computer science and computer technology.'),
    ('university-of-computer-studies-kyaingtong', 'University of Computer Studies, Kyaingtong', 'UCS Kyaingtong', 'public', 'Kyaingtong', 'Shan State', null, null,
     'Public computer studies university awarding degrees in computer science and computer technology.'),
    ('university-of-computer-studies-panglong', 'University of Computer Studies, Panglong', 'UCS Panglong', 'public', 'Panglong', 'Shan State', null, null,
     'Public computer studies university awarding degrees in computer science and computer technology.'),
    ('technological-university-taunggyi', 'Technological University, Taunggyi', 'TU Taunggyi', 'public', 'Taunggyi', 'Shan State', null, null,
     'Public engineering university awarding bachelor''s degrees across the core engineering disciplines.'),
    ('technological-university-lashio', 'Technological University, Lashio', 'TU Lashio', 'public', 'Lashio', 'Shan State', null, null,
     'Public engineering university awarding bachelor''s degrees across the core engineering disciplines.'),
    ('technological-university-kyaingtong', 'Technological University, Kyaingtong', 'TU Kyaingtong', 'public', 'Kyaingtong', 'Shan State', null, null,
     'Public engineering university awarding bachelor''s degrees across the core engineering disciplines.'),
    ('technological-university-panglong', 'Technological University, Panglong', 'TU Panglong', 'public', 'Panglong', 'Shan State', null, null,
     'Public engineering university awarding bachelor''s degrees across the core engineering disciplines.'),

    -- Tanintharyi Region ---------------------------------------------------
    ('dawei-university', 'Dawei University', 'DWU', 'public', 'Dawei', 'Tanintharyi Region', 1999::smallint, null,
     'Public arts and science university in Dawei, serving the northern Tanintharyi Region.'),
    ('myeik-university', 'Myeik University', 'MEU', 'public', 'Myeik', 'Tanintharyi Region', 1999::smallint, null,
     'Public arts and science university in Myeik, serving the southern Tanintharyi Region.'),
    ('university-of-computer-studies-dawei', 'University of Computer Studies, Dawei', 'UCS Dawei', 'public', 'Dawei', 'Tanintharyi Region', null, null,
     'Public computer studies university awarding degrees in computer science and computer technology.'),
    ('university-of-computer-studies-myeik', 'University of Computer Studies, Myeik', 'UCS Myeik', 'public', 'Myeik', 'Tanintharyi Region', null, null,
     'Public computer studies university awarding degrees in computer science and computer technology.'),
    ('polytechnic-university-dawei', 'Polytechnic University, Dawei', 'PolyU Dawei', 'public', 'Dawei', 'Tanintharyi Region', null, null,
     'Public polytechnic university awarding applied engineering and technology degrees.'),
    ('polytechnic-university-myeik', 'Polytechnic University, Myeik', 'PolyU Myeik', 'public', 'Myeik', 'Tanintharyi Region', null, null,
     'Public polytechnic university awarding applied engineering and technology degrees.'),

    -- Yangon Region --------------------------------------------------------
    ('university-of-yangon', 'University of Yangon', 'UY', 'public', 'Yangon', 'Yangon Region', 1920::smallint, 'https://www.uy.edu.mm/',
     'Myanmar''s oldest and most prominent university, offering postgraduate and research degrees across the arts and sciences.'),
    ('dagon-university', 'Dagon University', 'DU', 'public', 'Yangon', 'Yangon Region', 1993::smallint, null,
     'Public arts and science university in North Dagon offering undergraduate and postgraduate degrees across the humanities and sciences.'),
    ('university-of-east-yangon', 'University of East Yangon', 'UEY', 'public', 'Thanlyin', 'Yangon Region', 1998::smallint, null,
     'Public arts and science university in Thanlyin serving eastern Yangon Region.'),
    ('university-of-west-yangon', 'University of West Yangon', 'UWY', 'public', 'Htantabin', 'Yangon Region', 1998::smallint, null,
     'Public arts and science university serving western Yangon Region.'),
    ('yangon-university-of-economics', 'Yangon University of Economics', 'YUEco', 'public', 'Yangon', 'Yangon Region', 1964::smallint, null,
     'Myanmar''s leading economics university, awarding degrees in economics, commerce, statistics and business administration.'),
    ('yangon-university-of-education', 'Yangon University of Education', 'YUEdu', 'public', 'Yangon', 'Yangon Region', 1964::smallint, null,
     'Public university of education preparing secondary school teachers and awarding postgraduate degrees in education.'),
    ('yangon-technological-university', 'Yangon Technological University', 'YTU', 'public', 'Yangon', 'Yangon Region', 1924::smallint, 'http://ytu.edu.mm/',
     'Myanmar''s foremost engineering university, awarding bachelor''s, master''s and doctoral degrees across the engineering disciplines.'),
    ('west-yangon-technological-university', 'West Yangon Technological University', 'WYTU', 'public', 'Htantabin', 'Yangon Region', null, null,
     'Public engineering university serving western Yangon Region, awarding bachelor''s degrees in engineering.'),
    ('technological-university-hmawbi', 'Technological University, Hmawbi', 'TU Hmawbi', 'public', 'Hmawbi', 'Yangon Region', null, null,
     'Public engineering university awarding bachelor''s degrees across the core engineering disciplines.'),
    ('technological-university-thanlyin', 'Technological University, Thanlyin', 'TU Thanlyin', 'public', 'Thanlyin', 'Yangon Region', null, null,
     'Public engineering university awarding bachelor''s degrees across the core engineering disciplines.'),
    ('university-of-computer-studies-yangon', 'University of Computer Studies, Yangon', 'UCSY', 'public', 'Yangon', 'Yangon Region', 1971::smallint, 'https://www.ucsy.edu.mm/',
     'Myanmar''s leading computer studies university, awarding bachelor''s, master''s and doctoral degrees in computer science and technology.'),
    ('university-of-information-technology', 'University of Information Technology', 'UIT', 'public', 'Yangon', 'Yangon Region', 2012::smallint, 'https://uit.edu.mm/',
     'Public information technology university awarding degrees in computer science, software engineering and knowledge engineering.'),
    ('myanmar-maritime-university', 'Myanmar Maritime University', 'MMU', 'public', 'Yangon', 'Yangon Region', 2002::smallint, 'https://www.mmu.edu.mm/',
     'Public maritime university awarding degrees in marine engineering, nautical science, naval architecture and port management.'),
    ('university-of-medicine-1-yangon', 'University of Medicine 1, Yangon', 'UM 1 Yangon', 'public', 'Yangon', 'Yangon Region', 1927::smallint, null,
     'Myanmar''s oldest medical school, training physicians and awarding postgraduate medical degrees under the Ministry of Health.'),
    ('university-of-medicine-2-yangon', 'University of Medicine 2, Yangon', 'UM 2 Yangon', 'public', 'North Okkalapa', 'Yangon Region', 1963::smallint, null,
     'Public medical university in North Okkalapa, training physicians and awarding postgraduate medical degrees.'),
    ('university-of-dental-medicine-yangon', 'University of Dental Medicine, Yangon', 'UDM Yangon', 'public', 'Yangon', 'Yangon Region', 1964::smallint, null,
     'Public dental university awarding the Bachelor of Dental Surgery and postgraduate dental degrees.'),
    ('university-of-pharmacy-yangon', 'University of Pharmacy, Yangon', 'UP Yangon', 'public', 'Yangon', 'Yangon Region', 1964::smallint, null,
     'Public pharmacy university awarding undergraduate and postgraduate degrees in pharmaceutical science.'),
    ('university-of-medical-technology-yangon', 'University of Medical Technology, Yangon', 'UMT Yangon', 'public', 'Yangon', 'Yangon Region', 1964::smallint, null,
     'Public university training medical laboratory, radiography and physiotherapy professionals.'),
    ('university-of-nursing-yangon', 'University of Nursing, Yangon', 'UN Yangon', 'public', 'Yangon', 'Yangon Region', 1991::smallint, null,
     'Public nursing university awarding undergraduate and postgraduate nursing degrees under the Ministry of Health.'),
    ('university-of-public-health-yangon', 'University of Public Health, Yangon', 'UPH Yangon', 'public', 'Yangon', 'Yangon Region', null, null,
     'Public university awarding postgraduate degrees in public health, epidemiology and health systems management.'),
    ('university-of-paramedical-science-yangon', 'University of Paramedical Science, Yangon', 'UPS Yangon', 'public', 'Yangon', 'Yangon Region', null, null,
     'Public university training paramedical and allied health professionals.'),
    ('university-of-foreign-languages-yangon', 'University of Foreign Languages, Yangon', 'UFL Yangon', 'public', 'Yangon', 'Yangon Region', 1964::smallint, null,
     'Public university specialising in modern language degrees including English, Chinese, Japanese, French, German and Korean.'),
    ('national-university-of-arts-and-culture-yangon', 'National University of Arts and Culture, Yangon', 'NUAC Yangon', 'public', 'Yangon', 'Yangon Region', 1993::smallint, null,
     'Public university for the performing and visual arts, awarding degrees in music, dramatic art, painting and sculpture.'),
    ('university-of-distance-education-yangon', 'University of Distance Education, Yangon', 'UDE Yangon', 'public', 'Yangon', 'Yangon Region', null, null,
     'Public distance learning university delivering arts and science degrees to students across lower Myanmar.'),
    ('university-of-co-operative-and-management-thanlyin', 'University of Co-operative and Management, Thanlyin', 'UCM Thanlyin', 'public', 'Thanlyin', 'Yangon Region', null, null,
     'Public university awarding degrees in co-operative studies, management and development economics.'),
    ('international-theravada-buddhist-missionary-university', 'International Theravada Buddhist Missionary University', 'ITBMU', 'public', 'Yangon', 'Yangon Region', 1998::smallint, null,
     'State Buddhist university teaching in English, awarding degrees in Theravada Buddhist studies to Myanmar and international students.'),
    ('state-pariyatti-sasana-university-yangon', 'State Pariyatti Sasana University, Yangon', 'SPSU Yangon', 'public', 'Yangon', 'Yangon Region', 1986::smallint, null,
     'State Buddhist university awarding degrees in Pariyatti Buddhist studies, Pali language and Buddhist philosophy.'),
    ('defence-services-medical-academy', 'Defence Services Medical Academy', 'DSMA', 'public', 'Yangon', 'Yangon Region', 1992::smallint, null,
     'Military medical academy training physicians for the Myanmar armed forces.'),
    ('myanmar-institute-of-theology', 'Myanmar Institute of Theology', 'MIT', 'private', 'Yangon', 'Yangon Region', 1927::smallint, null,
     'Private Christian institution in Insein awarding degrees in theology and, through its liberal arts programme, in the humanities.'),
    ('myanmar-imperial-university', 'Myanmar Imperial University', 'MIU', 'private', 'Yangon', 'Yangon Region', null, null,
     'Private university in Yangon offering business, computing and engineering degrees in partnership with overseas universities.'),
    ('strategy-first-university', 'Strategy First University', 'SFU', 'private', 'Yangon', 'Yangon Region', null, null,
     'Private university in Yangon offering business, computing and media degrees with international partner awards.'),
    ('sti-myanmar-university', 'STI Myanmar University', 'STIMU', 'private', 'Yangon', 'Yangon Region', null, null,
     'Private university in Yangon offering information technology, engineering and business programmes.'),
    ('auston-university-myanmar', 'Auston University Myanmar', 'AUM', 'private', 'Yangon', 'Yangon Region', null, null,
     'Private university in Yangon delivering engineering and computing degrees with Singaporean and British partner awards.'),
    ('city-university-yangon', 'City University, Yangon', 'CUY', 'private', 'Yangon', 'Yangon Region', null, null,
     'Private university in Yangon offering business, computing and engineering programmes.'),
    ('info-myanmar-university', 'Info Myanmar University', 'IMU', 'private', 'Yangon', 'Yangon Region', null, null,
     'Private university in Yangon offering information technology and business degrees with international partner awards.'),

    -- Additional institutions in the 96-entry uniRank degree directory -----
    ('naypyitaw-technological-university', 'Naypyitaw Technological University', 'NPTTU', 'public', 'Naypyidaw', 'Nay Pyi Taw Union Territory', 2007::smallint, null,
     'Public technological university in Naypyidaw awarding undergraduate engineering and technology degrees.'),
    ('technological-university-mandalay', 'Technological University, Mandalay', 'TU Mandalay', 'public', 'Patheingyi', 'Mandalay Region', null, null,
     'Public technological university in the Mandalay Region awarding undergraduate engineering degrees.'),
    ('technological-university-yamethin', 'Technological University, Yamethin', 'TU Yamethin', 'public', 'Yamethin', 'Mandalay Region', null, null,
     'Public technological university in Yamethin awarding undergraduate engineering degrees.'),
    ('university-of-myitkyina', 'University of Myitkyina', 'UMK', 'public', 'Myitkyina', 'Kachin State', null, null,
     'Public arts and science university in Myitkyina offering undergraduate degrees in the humanities and sciences.'),
    ('university-of-pyay', 'University of Pyay', 'UPY', 'public', 'Pyay', 'Bago Region', null, null,
     'Public arts and science university in Pyay offering undergraduate degrees in the humanities and sciences.')
)
insert into public.universities (
  slug, name, short_name, university_type, city, region, country_code,
  founded_year, website_url, description, is_published, data_source_url
)
select
  seed.slug,
  seed.name,
  seed.short_name,
  seed.university_type::public.university_type,
  seed.city,
  seed.region,
  'MM',
  seed.founded_year,
  seed.website_url,
  seed.description,
  true,
  'https://www.unirank.org/mm/a-z/'
from seed
where seed.slug in (
  'bago-university',
  'bhamo-university',
  'dagon-university',
  'dawei-university',
  'university-of-east-yangon',
  'hinthada-university',
  'hpa-an-university',
  'university-of-kalay',
  'kyaingtong-university',
  'technological-university-kyaukse',
  'kyaukse-university',
  'lashio-university',
  'loikaw-university',
  'magway-university',
  'mandalay-technological-university',
  'mandalay-university',
  'university-of-foreign-languages-mandalay',
  'maubin-university',
  'mawlamyine-university',
  'meiktila-university',
  'meiktila-university-of-economics',
  'monywa-university',
  'monywa-university-of-economics',
  'myanmar-aerospace-engineering-university',
  'myanmar-maritime-university',
  'myeik-university',
  'national-university-of-arts-and-culture-mandalay',
  'national-university-of-arts-and-culture-yangon',
  'naypyitaw-technological-university',
  'pakokku-university',
  'panglong-university',
  'pathein-university',
  'polytechnic-university-dawei',
  'polytechnic-university-myeik',
  'pyay-technological-university',
  'sagaing-university',
  'sagaing-university-of-education',
  'shwebo-university',
  'sittway-university',
  'taunggyi-university',
  'taungoo-university',
  'technological-university-thanlyin',
  'technological-university-bhamo',
  'technological-university-hinthada',
  'technological-university-hmawbi',
  'technological-university-hpa-an',
  'technological-university-kalay',
  'technological-university-kyaingtong',
  'technological-university-lashio',
  'technological-university-loikaw',
  'technological-university-magway',
  'technological-university-mandalay',
  'technological-university-maubin',
  'technological-university-mawlamyine',
  'technological-university-meiktila',
  'technological-university-monywa',
  'technological-university-myitkyina',
  'technological-university-pakokku',
  'technological-university-panglong',
  'technological-university-pathein',
  'technological-university-sagaing',
  'technological-university-sittwe',
  'technological-university-taunggyi',
  'technological-university-taungoo',
  'technological-university-yamethin',
  'university-of-community-health-magway',
  'university-of-computer-studies-mandalay',
  'university-of-computer-studies-yangon',
  'university-of-dental-medicine-mandalay',
  'university-of-dental-medicine-yangon',
  'university-of-forestry-and-environmental-science-yezin',
  'university-of-information-technology',
  'university-of-medical-technology-mandalay',
  'university-of-medical-technology-yangon',
  'university-of-medicine-1-yangon',
  'university-of-medicine-2-yangon',
  'university-of-medicine-magway',
  'university-of-medicine-mandalay',
  'university-of-medicine-taunggyi',
  'university-of-myitkyina',
  'university-of-nursing-mandalay',
  'university-of-nursing-yangon',
  'university-of-pharmacy-mandalay',
  'university-of-pharmacy-yangon',
  'university-of-public-health-yangon',
  'university-of-pyay',
  'university-of-technology-yadanabon-cyber-city',
  'university-of-veterinary-science-yezin',
  'university-of-west-yangon',
  'west-yangon-technological-university',
  'yadanabon-university',
  'yangon-technological-university',
  'university-of-yangon',
  'yangon-university-of-economics',
  'yangon-university-of-education',
  'university-of-foreign-languages-yangon',
  'yezin-agricultural-university'
)
on conflict (slug) do update set
  region = coalesce(public.universities.region, excluded.region),
  website_url = coalesce(public.universities.website_url, excluded.website_url),
  founded_year = coalesce(public.universities.founded_year, excluded.founded_year),
  data_source_url = coalesce(public.universities.data_source_url, excluded.data_source_url),
  updated_at = now();

-- ---------------------------------------------------------------------------
-- Retire the demo placeholders
--
-- These two rows were invented for the original prototype and do not name real
-- institutions. They are archived rather than deleted because posts, questions
-- and student profiles may already reference them, and the real Taunggyi and
-- Nay Pyi Taw institutions are seeded above under their proper names.
-- ---------------------------------------------------------------------------

update public.universities
set archived_at = now(),
    is_published = false,
    updated_at = now()
where slug in ('nay-pyi-taw-institute', 'taunggyi-institute-of-science')
  and archived_at is null;

-- ---------------------------------------------------------------------------
-- Indexes for the directory browse experience
--
-- The index page moves from loading every row to server-side filtering by
-- region, type and name, so those predicates need support at 96 rows and
-- beyond.
-- ---------------------------------------------------------------------------

create index if not exists universities_region_idx
  on public.universities (region)
  where archived_at is null;

create index if not exists universities_city_idx
  on public.universities (city)
  where archived_at is null;

create index if not exists universities_published_name_idx
  on public.universities (name)
  where is_published and archived_at is null;
