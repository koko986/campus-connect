# TAKKA Project Flowcharts

> Visual reference for the member experience, administration workflow, system architecture, and data flow.

## 1. Complete Product Flow

```mermaid
flowchart TD
    Start([Open TAKKA]) --> Session{Authenticated?}

    Session -- No --> Landing[Landing page]
    Landing --> Choice{Choose an action}
    Choice -- Log in --> Login[Enter email and password]
    Choice -- Create account --> Role{Select account type}

    Role -- Current student --> StudentForm[Enter personal and university details]
    StudentForm --> SelectUniversity[Select university]
    SelectUniversity --> SelectDepartment[Select department]
    SelectDepartment --> CreateStudent[Create student account]

    Role -- Prospective student --> ProspectForm[Enter personal and study preferences]
    ProspectForm --> CreateProspect[Create prospective account]

    Login --> Authenticate[Supabase authentication]
    CreateStudent --> Authenticate
    CreateProspect --> Authenticate

    Authenticate --> AuthResult{Successful?}
    AuthResult -- No --> AuthError[Show clear error and allow retry]
    AuthError --> Login
    AuthResult -- Yes --> AccountCheck[Check account moderation status]

    AccountCheck --> Allowed{Account active?}
    Allowed -- No --> Restricted[Show blocked or deleted account state]
    Allowed -- Yes --> Dashboard[Community dashboard]

    Dashboard --> MainNav{Select area}
    MainNav --> Universities[University directory]
    MainNav --> Hub[Student Hub]
    MainNav --> Community[Posts and Q&A]
    MainNav --> Messages[Messages]
    MainNav --> Profile[Profile and settings]
    MainNav --> Notifications[Notifications]

    Universities --> UniversityDetails[University details]
    UniversityDetails --> SaveUniversity[Save to shortlist]
    UniversityDetails --> UniversityContent[View campuses, departments, programs, and photos]

    Hub --> HubChoice{Choose Hub tool}
    HubChoice --> Matcher[University matcher and comparison]
    HubChoice --> Opportunities[Opportunity board]
    HubChoice --> Buddies[Study-buddy matching]

    Community --> Posts[Create, like, save, comment, or report posts]
    Community --> Questions[Ask, answer, vote, or accept an answer]

    Messages --> Conversation{Conversation type}
    Conversation --> Direct[Direct conversation]
    Conversation --> Group[University group]

    Profile --> EditProfile[Edit personal and academic details]
    Profile --> Verification[Current student verification]
```

## 2. Authentication And Registration Flow

```mermaid
flowchart TD
    Open([User opens app]) --> HasSession{Existing session?}
    HasSession -- Yes --> LoadProfile[Load member profile]
    HasSession -- No --> AuthPage[Login or registration]

    AuthPage --> Existing{Already registered?}
    Existing -- Yes --> Credentials[Submit email and password]
    Existing -- No --> Role{Account type}

    Role -- University student --> StudentData[Name, email, password, university, department, student details]
    Role -- Prospective student --> ProspectData[Name, email, password, field, city, degree preference]

    StudentData --> SignUp[Create Supabase Auth user]
    ProspectData --> SignUp
    Credentials --> SignIn[Sign in with Supabase Auth]

    SignUp --> ProfileTrigger[Create role-specific database profile]
    ProfileTrigger --> Session
    SignIn --> Session[Receive authenticated session]

    Session --> DirectAccess{Supabase reachable?}
    DirectAccess -- Yes --> Supabase[Use Supabase directly]
    DirectAccess -- No --> Proxy[Use Java Supabase proxy]

    Supabase --> Status[Request account status]
    Proxy --> Status
    Status --> Active{Active account?}

    Active -- Yes --> App[Open authenticated application]
    Active -- Blocked --> Blocked[Display blocked-account message]
    Active -- Deleted --> SignedOut[Clear session and deny access]
```

## 3. University Discovery And Matcher Flow

```mermaid
flowchart TD
    Directory([Open Universities]) --> LoadUniversities[Load published universities]
    LoadUniversities --> Search[Search and filter]
    Search --> Select[Select a university]
    Select --> Details[View university details]

    Details --> Information{Explore information}
    Information --> Campus[Campuses]
    Information --> Department[Departments]
    Information --> Program[Programs and degrees]
    Information --> Photos[Approved university photos]
    Information --> Contact[Website and contact information]
    Details --> Shortlist[Save or remove from shortlist]

    MatcherStart([Open Decision Center]) --> LoadPreferences[Load saved preferences]
    LoadPreferences --> ChoosePreferences[Choose field, city, degree, type, and priorities]
    ChoosePreferences --> Normalize[Normalize legacy and no-preference values]
    Normalize --> SavePreferences[Save matcher preferences]
    SavePreferences --> RPC[Run recommend_universities_v2]
    RPC --> Score[Calculate weighted match scores and reasons]
    Score --> Results{Matches found?}

    Results -- No --> Relax[Suggest broader preferences]
    Relax --> ChoosePreferences
    Results -- Yes --> Ranked[Show ranked university cards]
    Ranked --> CompareSelect[Select up to three universities]
    CompareSelect --> Compare[Side-by-side comparison]
    Ranked --> Shortlist
```

## 4. Community And Q&A Flow

```mermaid
flowchart TD
    Community([Open Community]) --> ContentType{Choose content}

    ContentType --> Feed[Post feed]
    Feed --> Sort[Sort by best or newest]
    Feed --> CreatePost[Create text or image post]
    Feed --> Interact{Post action}
    Interact --> Like[Like or unlike]
    Interact --> Save[Save or unsave]
    Interact --> Comment[Add comment or reply]
    Interact --> ReportPost[Report content]
    Interact --> DeletePost[Author soft-deletes content]

    ContentType --> QA[Questions and answers]
    QA --> SearchQuestions[Search or filter by tag]
    QA --> Ask[Create a question]
    QA --> OpenQuestion[Open question thread]
    OpenQuestion --> Answer[Write an answer]
    OpenQuestion --> Vote[Vote for an answer]
    OpenQuestion --> Accept{Question author?}
    Accept -- Yes --> Accepted[Mark accepted answer]
    Accept -- No --> Read[Continue reading]

    Comment --> TriggerNotification[Create notification]
    Answer --> TriggerNotification
    Vote --> TriggerNotification
    Accepted --> TriggerNotification
    TriggerNotification --> Realtime[Realtime notification update]
```

## 5. Opportunity Flow

```mermaid
flowchart TD
    OpenBoard([Open Opportunities]) --> Load[Load published opportunities]
    Load --> Filter[Search and filter by category, deadline, or saved state]
    Filter --> View[View opportunity details]
    View --> Official[Open official source]
    View --> Bookmark[Save opportunity]
    Bookmark --> Reminder[Create deadline reminder]
    Reminder --> Due{Deadline approaching?}
    Due -- Yes --> Notify[Create in-app reminder notification]

    OpenBoard --> Submit[Submit an opportunity]
    Submit --> Validate[Validate title, organization, deadline, eligibility, and URL]
    Validate --> Pending[Save with pending status]
    Pending --> AdminReview[Administrator reviews submission]
    AdminReview --> Decision{Decision}
    Decision -- Approve --> Published[Publish opportunity]
    Decision -- Reject --> Rejected[Record rejection]
    Decision -- Close or archive --> Closed[Hide from active board]
    Published --> Load
```

## 6. Student Verification And Study-Buddy Flow

```mermaid
flowchart TD
    Student([Current student]) --> SubmitVerification[Submit university student details]
    SubmitVerification --> Pending[Verification pending]
    Pending --> Admin[Administrator reviews student record]
    Admin --> VerifyDecision{Decision}
    VerifyDecision -- Verify --> Verified[Student becomes verified]
    VerifyDecision -- Reject --> Rejected[Show rejected verification status]
    Rejected --> SubmitVerification

    Verified --> BuddyOptIn[Create opt-in study-buddy profile]
    BuddyOptIn --> Preferences[Add topics, goals, mode, languages, and availability]
    Preferences --> Visible{Profile visible?}
    Visible -- No --> Paused[Matching paused]
    Visible -- Yes --> FindMatches[Find compatible verified students]

    FindMatches --> Ranked[Rank by shared topics, schedule, mode, and department]
    Ranked --> MatchAction{Choose action}
    MatchAction --> Dismiss[Hide match]
    MatchAction --> Request[Send study request and note]

    Request --> Response{Other student responds}
    Response -- Decline --> Declined[Close request]
    Response -- Block --> Blocked[Prevent future matching]
    Response -- Accept --> Accepted[Create or open direct conversation]
    Accepted --> Chat[Students can message]
```

## 7. Messaging Flow

```mermaid
flowchart TD
    OpenMessages([Open Messages]) --> LoadConversations[Load reachable conversations]
    LoadConversations --> Choose{Select action}

    Choose --> Existing[Open existing conversation]
    Choose --> NewDirect[Select another student]
    Choose --> DiscoverGroup[Discover university groups]

    NewDirect --> StartRPC[start_direct_conversation]
    StartRPC --> Existing

    DiscoverGroup --> JoinRPC[join_university_group]
    JoinRPC --> Existing

    Existing --> LoadMessages[Load paginated message history]
    LoadMessages --> MarkRead[Update member read state]
    Existing --> Send[Send message]
    Send --> Store[Store message in database]
    Store --> Notify[Notify recipient]
    Store --> Realtime[Realtime message event]
    Realtime --> Refresh[Refresh message and unread counts]
    Refresh --> Existing

    Existing --> Leave{Leave group?}
    Leave -- Yes --> RemoveMembership[Remove conversation membership]
```

## 8. Reporting And Moderation Flow

```mermaid
flowchart TD
    Member([Authenticated member]) --> Report[Submit report]
    Report --> Token[Send Supabase bearer token]
    Token --> Backend[Spring Boot validates user]
    Backend --> StoreReport[Create pending report]

    Admin([Administrator]) --> AdminLogin[Sign in with Supabase credentials]
    AdminLogin --> AdminRecord{Active admin_users row?}
    AdminRecord -- No --> Deny[Deny administrator session]
    AdminRecord -- Yes --> Session[Create secure admin session]
    Session --> Console[Open moderation console]

    Console --> Queue{Select queue}
    Queue --> Reports[Reports]
    Queue --> Members[Accounts and verification]
    Queue --> Posts[Posts]
    Queue --> Universities[Universities and catalog]
    Queue --> Opportunities[Opportunities]
    Queue --> Photos[University photos]

    Reports --> ReviewReport[Review evidence and target]
    ReviewReport --> Resolve[Resolve or dismiss report]

    Members --> MemberAction{Choose action}
    MemberAction --> Block[Block or unblock]
    MemberAction --> Verify[Verify or reject student]
    MemberAction --> Delete[Super admin deletes account]

    Posts --> PostAction[Remove or restore post]
    Universities --> CatalogAction[Create, edit, publish, archive, or curate]
    Opportunities --> OpportunityAction[Approve, reject, close, or archive]
    Photos --> PhotoAction[Approve or reject photo]

    Resolve --> Audit[Append immutable moderation action]
    Block --> Audit
    Verify --> Audit
    Delete --> Audit
    PostAction --> Audit
    CatalogAction --> Audit
    OpportunityAction --> Audit
    PhotoAction --> Audit
```

## 9. Application Data Flow

```mermaid
sequenceDiagram
    actor User
    participant UI as React Member App
    participant Query as TanStack Query
    participant Auth as Supabase Auth
    participant DB as Supabase PostgreSQL
    participant RLS as Row Level Security
    participant Realtime as Supabase Realtime
    participant API as Spring Boot API

    User->>UI: Perform an action
    UI->>Auth: Read authenticated session
    Auth-->>UI: User and access token
    UI->>Query: Request or mutate data
    Query->>DB: Supabase request with token
    DB->>RLS: Evaluate role and ownership policies

    alt Access permitted
        RLS-->>DB: Allow operation
        DB-->>Query: Return live data
        Query-->>UI: Update cached view
        DB-->>Realtime: Publish relevant change
        Realtime-->>UI: Refresh messages or notifications
    else Access denied
        RLS-->>DB: Reject operation
        DB-->>Query: Return error
        Query-->>UI: Show actionable error state
    end

    opt Report or account-status operation
        UI->>API: Authenticated API request
        API->>Auth: Validate bearer token
        API->>DB: Perform permitted server operation
        DB-->>API: Result
        API-->>UI: JSON response
    end
```

## 10. Deployment And Network Fallback Flow

```mermaid
flowchart TD
    Browser([User browser]) --> Primary{Vercel reachable?}
    Primary -- Yes --> Vercel[Vercel member frontend]
    Primary -- No --> Railway[Railway frontend fallback URL]

    Railway --> RouteType{Request path}
    RouteType -- Member GET or HEAD --> Upstream[Relay configured Vercel frontend]
    RouteType -- /api/** --> SpringAPI[Spring Boot API]
    RouteType -- /admin/** --> AdminConsole[Spring Boot admin console]

    Vercel --> DataPath{Supabase reachable directly?}
    Upstream --> DataPath
    DataPath -- Yes --> Supabase[Supabase Auth, Database, Storage, and Realtime]
    DataPath -- No --> Proxy[Same-origin or Railway Supabase proxy]
    Proxy --> Supabase

    SpringAPI --> Supabase
    AdminConsole --> SpringAPI

    Health[Railway health monitor] --> Actuator[/actuator/health]
    Actuator --> SpringAPI
```

## 11. Simplified Presentation Flow

```mermaid
flowchart LR
    Register[Register or log in] --> Discover[Discover universities]
    Discover --> Decide[Match, shortlist, and compare]
    Decide --> Learn[Ask students and explore community]
    Learn --> Connect[Join groups or message students]
    Connect --> Grow[Find opportunities and study buddies]
    Grow --> Notify[Receive updates and reminders]

    Moderate[Admin moderation] -. protects .-> Register
    Moderate -. curates .-> Discover
    Moderate -. reviews .-> Learn
    Moderate -. approves .-> Grow
```

## 12. Flow Summary

TAKKA begins with role-based registration and secure authentication. Members then move through a connected cycle of university discovery, explainable decision support, community learning, messaging, and academic growth. Supabase enforces user-level data access, while the Spring Boot administration console handles privileged moderation and catalog operations. Vercel is the primary member-app host, with Railway providing backend services and a network-resilient fallback path.
