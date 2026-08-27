# Campus Connect

University Discovery & Student Community Web Application



1. Project Overview



The University Discovery & Student Community Web Application is a web-based platform designed to help high school graduates make better decisions when choosing a university.



Instead of relying only on official university information, rankings, or random information from social media, the platform connects prospective university students directly with current university students. Prospective students can explore universities, read real student experiences, ask questions, and communicate with students who are already studying there.



The first version of the project will focus on a simple but polished MVP with five core features:



Login → University Discovery → Student Posts → Q&A → Chat



The design will follow a modern, clean, minimal style inspired by the provided reference image, using white space, soft mint-green accents, rounded cards, subtle shadows, profile avatars, and a modern dashboard layout.



---



2. Main Goal



The main goal of the platform is:



«To help students choose the right university by giving them access to real university information and real student experiences.»



The platform should answer questions that are often difficult to find online, such as:



- What is student life actually like at this university?

- What facilities are available?

- What is the environment like?

- What do students normally do outside of classes?

- What is a specific department like?

- What should a new student prepare before joining?

- What are the advantages and disadvantages of studying there?

- Can I ask someone who is currently studying there?



---



3. Target Users



The MVP will support two main types of users.



A. Current University Student



A current university student can create an account and represent their university community.



During registration, the platform asks for:



- Full name

- Email

- Password

- University

- Faculty / Department

- Major

- Academic year

- Campus

- Profile picture



After registration, the student can:



- Create posts

- Share university experiences

- Answer questions

- Communicate with prospective students

- Join university-related conversations

- Participate in university communities



A verified student badge can later be added to increase trust.



Example:



John Doe

🟢 Verified Student

Computer Science · Year 3 · University X



---



B. Prospective University Student



A prospective student is someone who has graduated from high school or is preparing to enter university.



During registration, the platform asks for basic information such as:



- Full name

- Email

- Password

- Preferred field of study

- Preferred university location

- Interested majors

- Other university preferences



The prospective student can then:



- Explore universities

- Read student posts

- Ask questions

- Chat with current students

- Save interesting universities

- Compare information before making a decision



The recommendation system can be added in a future version.



---



4. Core MVP Features



4.1 Authentication



The first screen after clicking Get Started should allow users to choose their account type.



“What brings you here?”



Two large modern cards:



🎓 I’m a University Student



«I am currently studying at a university and want to share my experience.»



🎒 I’m Looking for a University



«I want to explore universities and learn from current students.»



The cards should have rounded corners, subtle shadows, simple illustrations/icons, and a soft mint-green interaction state.



After selecting an account type, the user continues to the appropriate registration form.



---



5. Home Dashboard



After logging in, users are taken to the main dashboard.



The dashboard should follow the visual style of the reference image.



Main Navigation



A clean sidebar or navigation bar should contain:



- Home

- Universities

- Questions

- Messages

- Profile

- Settings



The active navigation item should use the primary mint-green accent.



---



Dashboard Layout



The dashboard can be divided into three areas:



Left Side — Navigation



A simple vertical navigation menu.



Center — Main Feed



Displays recent student posts and questions.



Right Side — Discover / Suggested Content



Displays things such as:



- Popular universities

- Recommended questions

- Active students

- Trending discussions



The layout should remain spacious and uncluttered.



---



6. University Discovery



The University section is one of the most important parts of the MVP.



Users should be able to browse universities through clean, modern cards.



Each university card can contain:



- University logo

- University name

- Location

- Short description

- Number of departments

- Number of student posts

- Student rating, if implemented

- View button



Example:



University of Example



📍 Yangon



«A short description about the university and its academic environment.»



Computer Science · Engineering · Business



[ View University ]



---



Search and Filter



The university page should contain a prominent search bar:



«🔍 Search universities...»



Basic filters can include:



- Location

- Major

- Department

- University type



The MVP should keep filtering simple rather than implementing a complicated recommendation engine.



---



7. University Detail Page



When a user selects a university, they enter the university's dedicated page.



The page should contain:



University Header



- University logo

- University name

- Location

- Short description

- Follow / Save button



Example:



University X



📍 Yangon



«Learn about the university, explore student experiences, and ask current students questions.»



---



University Information



Basic information can include:



- About the university

- Departments

- Available majors

- Campus information

- Facilities

- Student activities



However, the MVP should avoid trying to create a huge encyclopedia.



The most important content is the student-generated information.



---



8. Student Posts



The Student Post system is one of the key features of the platform.



Current students can create posts about their university experience.



Examples:



«“Our university recently organized a technology event. Here are some photos.”»



«“Here are some things I wish I knew before starting my first year.”»



«“The library is open until 8 PM and has several study areas.”»



«“Our department organized a student project exhibition this week.”»



A post can contain:



- Profile picture

- Student name

- University

- Academic year

- Post text

- Images

- Timestamp

- Like

- Comment

- Share



---



Post Design



Posts should use rounded cards with:



- Soft borders

- Subtle shadows

- Plenty of whitespace

- Small profile avatars

- Clear typography

- Mint-green interaction elements



The visual style should closely follow the uploaded reference image.



The objective is to make the feed feel more like a modern student community platform rather than a traditional university website.



---



9. Q&A System



The Q&A feature allows prospective students to ask questions about universities.



For example:



Question



«What is Computer Science like at University X?»



Current students can respond.



Answer



«“I'm currently in my third year. The first year focuses more on fundamentals, while later years include more practical projects...”»



Users can:



- Ask questions

- Answer questions

- Reply to answers

- Like helpful answers

- View discussions



---



Helpful Answer System



A simple voting system can be used.



For example:



Was this answer helpful?



👍 24



This allows useful answers to become more visible.



In the future, the platform can introduce:



⭐ Best Answer



or



🟢 Verified Student Answer



---



10. Chat / Messaging



The Chat feature allows prospective students to communicate directly with current university students.



For example:



Prospective Student



«Hi! I'm interested in studying Computer Science at your university. Can I ask you a few questions?»



Current Student



«Sure! What would you like to know?»



The chat interface should be clean and minimal.



---



Chat Interface



The layout can contain:



Left Panel



Conversation list:



- Student name

- Profile picture

- Last message

- Timestamp

- Unread message count



Right Panel



Selected conversation:



- Student profile

- Online status

- Message history

- Message input

- Send button



The interface should use rounded message bubbles and the same mint-green design language as the rest of the application.



---



11. User Profile



Each user should have a profile page.



Current Student Profile



Profile Picture



John Doe



🟢 Verified Student



University X

Computer Science · Year 3



Profile Sections



- About

- Posts

- Questions answered

- University

- Academic year



The profile should help prospective students understand who they are talking to.



---



12. Student Verification



Trust is extremely important for this platform.



A future version should allow current university students to verify their university status.



After verification, their profile can display:



«🟢 Verified Student»



This badge can appear next to their name in:



- Posts

- Comments

- Answers

- Chat

- Profile



This helps prospective students distinguish between information shared by actual students and information shared by ordinary users.



---



13. UI / UX Design System



The overall design should be based on the uploaded reference image.



Visual Style



Modern + Minimal + Soft + Professional



The interface should avoid excessive colors and complicated layouts.



Primary Color



Soft mint green.



Background



White or very light gray.



Typography



Use a modern sans-serif font with clear hierarchy.



Components



Use:



- Rounded cards

- Rounded buttons

- Soft shadows

- Thin borders

- Simple line icons

- Circular profile images

- Spacious layouts

- Clear typography



---



Card Style



Cards should have:



- Medium-to-large border radius

- Very subtle shadow

- White background

- Comfortable internal spacing



For example:



┌─────────────────────────────────────┐

│  👤 John Doe              ⋯         │

│  🟢 Verified · Computer Science     │

│                                     │

│  “Here's what student life is like  │

│   at our university...”             │

│                                     │

│  [ University Image ]               │

│                                     │

│  ♡ 42       💬 12       ↗ Share     │

└─────────────────────────────────────┘



---



14. Responsive Design



The application should work well on:



- Desktop

- Laptop

- Tablet

- Mobile



On desktop, the application can use a sidebar + main feed + secondary panel.



On mobile, the sidebar should transform into a bottom navigation or compact navigation menu.



The UI should remain clean and easy to use on smaller screens.



---



15. MVP User Journey



A typical prospective student journey should look like:



Landing Page

      ↓

Create Account

      ↓

“I’m Looking for a University”

      ↓

Complete Basic Profile

      ↓

Home Dashboard

      ↓

Explore Universities

      ↓

Select a University

      ↓

Read University Information

      ↓

Read Student Posts

      ↓

Ask a Question

      ↓

Receive Answers

      ↓

Chat with a Current Student

      ↓

Make a Better University Decision



A current student journey:



Landing Page

      ↓

Create Account

      ↓

“I’m a University Student”

      ↓

Enter University Information

      ↓

Create Profile

      ↓

Home Dashboard

      ↓

Create Student Posts

      ↓

Answer Questions

      ↓

Receive Messages

      ↓

Help Prospective Students



---



16. MVP Scope



To keep the first version focused, the MVP should not include too many advanced features.



Must Have



- User registration

- Login

- Two user types

- User profiles

- University listing

- University detail page

- Student posts

- Comments

- Q&A

- One-to-one chat

- Basic search

- Basic notifications



Later Versions



The following can be added after the MVP is stable:



- University comparison

- University reviews

- Advanced filtering

- University recommendation system

- AI university assistant

- Group chat

- Events

- Clubs

- University official accounts

- Student reputation system

- Advanced student verification

- Career and major recommendations



---



17. Project Identity



The application should not feel like another university directory.



Its identity should be:



«A place where students can discover universities through the experiences of the people who actually study there.»



The university database provides the basic information.



The student community provides the real experience.



The Q&A system provides direct answers.



The chat system provides personal communication.



Together, these create a platform that helps students move from:



“I don't know which university to choose.”



to:



“I understand my options, I've heard from real students, and I can make a more informed decision.”



---



18. Recommended MVP Structure



The final MVP can be organized into these main pages:



1. Landing Page

2. Login

3. Register

   ├── Current Student

   └── Prospective Student



4. Home Dashboard

5. Universities

6. University Detail

7. Student Feed

8. Questions / Q&A

9. Chat / Messages

10. User Profile

11. Settings



The most important principle is to keep the functionality simple but make the UI feel polished.



A small application with excellent UX, consistent components, smooth interactions, and a strong visual identity will be much more impressive than a large application containing many unfinished features.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/5dc9d2a7-240e-4a56-bca8-1cb3a90722e0).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
