import libraryImg from "@/assets/post-library.jpg";
import techFairImg from "@/assets/post-techfair.jpg";

export type University = {
  id: string;
  name: string;
  short: string;
  location: string;
  type: "Public" | "Private";
  description: string;
  about: string;
  departments: string[];
  majors: string[];
  facilities: string[];
  activities: string[];
  campuses: string[];
  posts: number;
  rating: number;
  students: number;
};

export const universities: University[] = [
  {
    id: "uy",
    name: "University of Yangon",
    short: "UY",
    location: "Yangon",
    type: "Public",
    description:
      "A historic campus with strong humanities and science faculties, right in the heart of the city.",
    about:
      "Founded in 1878, the University of Yangon is the country's oldest university. The main campus mixes colonial-era halls with newer science blocks, and student life revolves around the central lawn and the library reading rooms.",
    departments: ["Computer Science", "Engineering", "Business", "Physics", "Law"],
    majors: ["Software Engineering", "Data Science", "Economics", "Applied Physics"],
    facilities: ["Central library (open until 8 PM)", "Computer labs", "Sports ground", "Student canteen"],
    activities: ["Tech week", "Debate society", "Photography club", "Volunteer program"],
    campuses: ["Main campus (Kamayut)", "Hlaing campus"],
    posts: 128,
    rating: 4.6,
    students: 412,
  },
  {
    id: "ytu",
    name: "Yangon Technological University",
    short: "YTU",
    location: "Yangon",
    type: "Public",
    description: "Engineering-focused university known for hands-on labs and a strong project culture.",
    about:
      "YTU is the country's leading engineering school. Coursework is project-heavy from second year onward, and most departments run an annual exhibition where students demo their work.",
    departments: ["Civil Engineering", "Mechanical Engineering", "Electronics", "Computer Engineering"],
    majors: ["Mechatronics", "Embedded Systems", "Structural Engineering"],
    facilities: ["Fabrication lab", "Robotics workshop", "Hostels", "24/7 study rooms"],
    activities: ["Robotics club", "Annual project exhibition", "Hackathons"],
    campuses: ["Gyogone campus"],
    posts: 96,
    rating: 4.4,
    students: 288,
  },
  {
    id: "umn",
    name: "Mandalay University",
    short: "MU",
    location: "Mandalay",
    type: "Public",
    description: "A spacious campus with a friendly community and growing research programs.",
    about:
      "Mandalay University offers a quieter, greener campus experience. Class sizes are smaller than in Yangon and lecturers are generally easy to reach outside of class hours.",
    departments: ["Computer Science", "Chemistry", "Education", "Geography"],
    majors: ["Information Science", "Environmental Chemistry", "Teaching"],
    facilities: ["New library wing", "Botanical garden", "Dormitories"],
    activities: ["Cultural festival", "Science fair", "Football league"],
    campuses: ["Main campus"],
    posts: 74,
    rating: 4.3,
    students: 190,
  },
  {
    id: "uce",
    name: "University of Computer Studies",
    short: "UCS",
    location: "Yangon",
    type: "Public",
    description: "Specialised in computing, with internship links to local software companies.",
    about:
      "UCS focuses entirely on computing disciplines. The final year includes an industry internship, and the career office keeps an active list of partner companies.",
    departments: ["Software Engineering", "Cyber Security", "Business Information Systems"],
    majors: ["Software Engineering", "Cyber Security", "Knowledge Engineering"],
    facilities: ["Cloud lab", "Career centre", "Startup incubator space"],
    activities: ["Coding contests", "Industry talks", "Open source club"],
    campuses: ["Shwe Pyi Thar campus"],
    posts: 152,
    rating: 4.7,
    students: 501,
  },
  {
    id: "npt",
    name: "Nay Pyi Taw Institute",
    short: "NPT",
    location: "Nay Pyi Taw",
    type: "Private",
    description: "Small private institute with business and design programs and modern facilities.",
    about:
      "A newer private institute with small cohorts, industry-led teaching and a heavy emphasis on portfolio work for design students.",
    departments: ["Business", "Design", "Media"],
    majors: ["Marketing", "UI/UX Design", "Digital Media"],
    facilities: ["Design studio", "Media room", "Café and co-working area"],
    activities: ["Portfolio nights", "Brand week", "Internship fair"],
    campuses: ["Zabuthiri campus"],
    posts: 41,
    rating: 4.1,
    students: 88,
  },
  {
    id: "tgi",
    name: "Taunggyi Institute of Science",
    short: "TGI",
    location: "Taunggyi",
    type: "Public",
    description: "Quiet hillside campus with strong natural science and agriculture programs.",
    about:
      "Located in the Shan hills, TGI is known for fieldwork-based science teaching and a close-knit hostel community.",
    departments: ["Biology", "Agriculture", "Chemistry"],
    majors: ["Agricultural Science", "Botany", "Food Technology"],
    facilities: ["Research farm", "Greenhouses", "Hostels"],
    activities: ["Field trips", "Nature society", "Harvest festival"],
    campuses: ["Main campus"],
    posts: 33,
    rating: 4.2,
    students: 65,
  },
];

export type Author = {
  id: string;
  name: string;
  initials: string;
  role: "student" | "prospective";
  verified: boolean;
  university?: string;
  universityId?: string;
  major?: string;
  year?: string;
  online?: boolean;
};

export const authors: Record<string, Author> = {
  john: {
    id: "john",
    name: "John Doe",
    initials: "JD",
    role: "student",
    verified: true,
    university: "University of Computer Studies",
    universityId: "uce",
    major: "Computer Science",
    year: "Year 3",
    online: true,
  },
  suemyat: {
    id: "suemyat",
    name: "Su Myat Aung",
    initials: "SM",
    role: "student",
    verified: true,
    university: "Yangon Technological University",
    universityId: "ytu",
    major: "Mechatronics",
    year: "Year 4",
    online: false,
  },
  kyaw: {
    id: "kyaw",
    name: "Kyaw Zin",
    initials: "KZ",
    role: "student",
    verified: false,
    university: "University of Yangon",
    universityId: "uy",
    major: "Economics",
    year: "Year 2",
    online: true,
  },
  hnin: {
    id: "hnin",
    name: "Hnin Wai",
    initials: "HW",
    role: "student",
    verified: true,
    university: "Mandalay University",
    universityId: "umn",
    major: "Information Science",
    year: "Year 3",
    online: false,
  },
  aung: {
    id: "aung",
    name: "Aung Khant",
    initials: "AK",
    role: "prospective",
    verified: false,
    online: true,
  },
};

export type Post = {
  id: string;
  authorId: keyof typeof authors;
  time: string;
  text: string;
  image?: string;
  likes: number;
  comments: number;
  tag: string;
};

export const posts: Post[] = [
  {
    id: "p1",
    authorId: "john",
    time: "2h ago",
    text: "Our department organised a technology exhibition this week — 30+ student projects, from campus navigation apps to a low-cost weather station. If you're thinking about applying here, this is the week to visit.",
    image: techFairImg,
    likes: 142,
    comments: 18,
    tag: "Campus life",
  },
  {
    id: "p2",
    authorId: "kyaw",
    time: "5h ago",
    text: "Things I wish I knew before first year: 1) buy the lab coat early, it sells out. 2) The 8 AM lectures are the least crowded. 3) Ask seniors for past papers — most are happy to share.",
    likes: 87,
    comments: 24,
    tag: "Advice",
  },
  {
    id: "p3",
    authorId: "suemyat",
    time: "Yesterday",
    text: "The library is open until 8 PM and has three separate study areas — silent, group, and a small computer zone. The group area on the second floor is the best kept secret on campus.",
    image: libraryImg,
    likes: 63,
    comments: 9,
    tag: "Facilities",
  },
  {
    id: "p4",
    authorId: "hnin",
    time: "2 days ago",
    text: "Honest take on my department: the first year is mostly theory and it can feel slow. From second year the practical work picks up a lot. If you like building things, push through year one.",
    likes: 51,
    comments: 12,
    tag: "Department",
  },
];

export type Answer = {
  id: string;
  authorId: keyof typeof authors;
  text: string;
  helpful: number;
  best?: boolean;
  time: string;
};

export type Question = {
  id: string;
  askerId: keyof typeof authors;
  universityId: string;
  title: string;
  detail: string;
  time: string;
  tags: string[];
  answers: Answer[];
};

export const questions: Question[] = [
  {
    id: "q1",
    askerId: "aung",
    universityId: "uce",
    title: "What is Computer Science actually like at UCS?",
    detail:
      "I'm deciding between UCS and YTU. I care most about how practical the coursework is and whether internships are realistic.",
    time: "3h ago",
    tags: ["Computer Science", "Coursework"],
    answers: [
      {
        id: "a1",
        authorId: "john",
        time: "1h ago",
        helpful: 24,
        best: true,
        text: "I'm in my third year. Year one is fundamentals — maths, C, discrete structures. From year two you do a group project every semester, and year four includes an industry internship. Most of my batch interned at local software companies.",
      },
      {
        id: "a2",
        authorId: "hnin",
        time: "40m ago",
        helpful: 8,
        text: "Not at UCS, but I interviewed with people from there. Their students are usually stronger on practical tooling than pure theory.",
      },
    ],
  },
  {
    id: "q2",
    askerId: "aung",
    universityId: "uy",
    title: "How is hostel life at University of Yangon?",
    detail: "I'll be moving from another region, so accommodation matters a lot to me.",
    time: "1 day ago",
    tags: ["Accommodation", "Student life"],
    answers: [
      {
        id: "a3",
        authorId: "kyaw",
        time: "20h ago",
        helpful: 15,
        text: "Rooms are shared, usually four people. Apply early — allocation happens before term starts and late applicants end up renting outside, which costs more.",
      },
    ],
  },
  {
    id: "q3",
    askerId: "aung",
    universityId: "ytu",
    title: "Is YTU worth it if I want to work in robotics?",
    detail: "Looking for honest pros and cons from people in the department.",
    time: "2 days ago",
    tags: ["Engineering", "Career"],
    answers: [
      {
        id: "a4",
        authorId: "suemyat",
        time: "1 day ago",
        helpful: 31,
        best: true,
        text: "Pros: the robotics workshop is genuinely good and the club is active year-round. Cons: equipment is shared, so you book slots. If you show up consistently you'll get plenty of hands-on time.",
      },
    ],
  },
];

export type Message = { id: string; from: "me" | "them"; text: string; time: string };

export type Conversation = {
  id: string;
  personId: keyof typeof authors;
  last: string;
  time: string;
  unread: number;
  messages: Message[];
};

export const conversations: Conversation[] = [
  {
    id: "c1",
    personId: "john",
    last: "Sure! What would you like to know?",
    time: "09:41",
    unread: 2,
    messages: [
      {
        id: "m1",
        from: "me",
        text: "Hi! I'm interested in studying Computer Science at your university. Can I ask you a few questions?",
        time: "09:38",
      },
      { id: "m2", from: "them", text: "Sure! What would you like to know?", time: "09:41" },
    ],
  },
  {
    id: "c2",
    personId: "suemyat",
    last: "The workshop is open on Saturdays too.",
    time: "Yesterday",
    unread: 0,
    messages: [
      { id: "m3", from: "me", text: "Does the robotics club accept first years?", time: "Yesterday" },
      {
        id: "m4",
        from: "them",
        text: "Yes, anyone can join. The workshop is open on Saturdays too.",
        time: "Yesterday",
      },
    ],
  },
  {
    id: "c3",
    personId: "kyaw",
    last: "I'd apply for the hostel in the first week.",
    time: "Mon",
    unread: 0,
    messages: [
      { id: "m5", from: "me", text: "How early should I apply for accommodation?", time: "Mon" },
      { id: "m6", from: "them", text: "I'd apply for the hostel in the first week.", time: "Mon" },
    ],
  },
];

export const currentUser: Author = authors.john;
