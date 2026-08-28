import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Bookmark, ExternalLink, LoaderCircle, Plus, Send } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { AuthorLine, PostCard, UniversityCard, UserAvatar } from "@/components/community";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import {
  createPost,
  createQuestion,
  getProfileDetails,
  getUniversity,
  listConversations,
  listPosts,
  listQuestions,
  listSavedUniversities,
  listStudentContacts,
  listUniversities,
  sendMessage,
  setUniversitySaved,
  startDirectConversation,
  updateProfile,
} from "@/lib/data";
import { supabase } from "@/lib/supabase";

const Loading = ({ label }: { label: string }) => (
  <div className="flex min-h-48 items-center justify-center text-sm text-muted-foreground">
    <LoaderCircle className="mr-2 size-5 animate-spin" />
    {label}
  </div>
);
const Failure = ({ error }: { error: Error }) => (
  <Alert variant="destructive">
    <AlertDescription>{error.message}</AlertDescription>
  </Alert>
);
const Empty = ({ title, text }: { title: string; text: string }) => (
  <div className="rounded-lg border border-dashed p-10 text-center">
    <h3 className="font-semibold">{title}</h3>
    <p className="mt-2 text-sm text-muted-foreground">{text}</p>
  </div>
);

function PostComposer() {
  const { user } = useAuth();
  const client = useQueryClient();
  const universities = useQuery({ queryKey: ["universities"], queryFn: listUniversities });
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [topic, setTopic] = useState("");
  const [universityId, setUniversityId] = useState("");
  const mutation = useMutation({
    mutationFn: () => createPost({ authorId: user!.id, body, topic, universityId }),
    onSuccess: async () => {
      setBody("");
      setTopic("");
      setUniversityId("");
      setOpen(false);
      await client.invalidateQueries({ queryKey: ["posts"] });
    },
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          New post
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share with the community</DialogTitle>
          <DialogDescription>
            Write from your own experience and protect personal information.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="post-body">Post</Label>
            <Textarea
              id="post-body"
              className="mt-1 min-h-32"
              maxLength={4000}
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="post-topic">Topic</Label>
            <Input
              id="post-topic"
              className="mt-1"
              maxLength={80}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>
          <Select value={universityId} onValueChange={setUniversityId}>
            <SelectTrigger>
              <SelectValue placeholder="University (optional)" />
            </SelectTrigger>
            <SelectContent>
              {universities.data?.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {mutation.error ? <Failure error={mutation.error} /> : null}
          <Button disabled={!body.trim() || mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? "Publishing..." : "Publish"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function DashboardPage() {
  const { profile, user } = useAuth();
  const posts = useQuery({ queryKey: ["posts"], queryFn: () => listPosts() });
  const saved = useQuery({
    queryKey: ["saved-universities", user!.id],
    queryFn: () => listSavedUniversities(user!.id),
  });
  const side = (
    <aside className="card-soft p-5">
      <h3 className="font-semibold">Saved universities</h3>
      <div className="mt-4 space-y-3">
        {saved.data?.map((u) => (
          <Link
            key={u.id}
            to="/universities/$id"
            params={{ id: u.id }}
            className="flex items-center gap-3 text-sm hover:text-primary"
          >
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary-soft text-xs font-bold">
              {u.short_name}
            </span>
            {u.name}
          </Link>
        ))}
        {saved.isSuccess && !saved.data.length ? (
          <p className="text-sm text-muted-foreground">No saved universities.</p>
        ) : null}
      </div>
    </aside>
  );
  return (
    <AppShell title="Home" right={side}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            Welcome, {profile?.full_name.split(" ")[0]}
          </p>
          <h2 className="mt-1 text-2xl font-bold">Student community</h2>
        </div>
        <PostComposer />
      </div>
      <div className="mt-6 space-y-4">
        {posts.isLoading ? <Loading label="Loading posts" /> : null}
        {posts.error ? <Failure error={posts.error} /> : null}
        {posts.data?.map((post) => (
          <PostCard key={post.id} post={post} userId={user!.id} />
        ))}
        {posts.isSuccess && !posts.data.length ? (
          <Empty title="No posts yet" text="Be the first to share something useful." />
        ) : null}
      </div>
    </AppShell>
  );
}

export function UniversitiesPage() {
  const [search, setSearch] = useState("");
  const query = useQuery({ queryKey: ["universities"], queryFn: listUniversities });
  const results = useMemo(
    () =>
      query.data?.filter(
        (u) =>
          !search.trim() ||
          [u.name, u.short_name, u.city, u.region].some((v) =>
            v?.toLowerCase().includes(search.toLowerCase()),
          ),
      ) ?? [],
    [query.data, search],
  );
  return (
    <AppShell title="Universities">
      <p className="text-sm text-muted-foreground">
        Published university records from the TAKKA database.
      </p>
      <h2 className="mt-1 text-2xl font-bold">Explore universities</h2>
      <Input
        className="mt-6 max-w-xl"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by university or city"
      />
      {query.isLoading ? <Loading label="Loading universities" /> : null}
      {query.error ? (
        <div className="mt-6">
          <Failure error={query.error} />
        </div>
      ) : null}
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {results.map((u) => (
          <UniversityCard key={u.id} university={u} />
        ))}
      </div>
      {query.isSuccess && !results.length ? (
        <div className="mt-6">
          <Empty title="No universities found" text="Try another name or city." />
        </div>
      ) : null}
    </AppShell>
  );
}

export function UniversityDetailPage({ id }: { id: string }) {
  const { user } = useAuth();
  const client = useQueryClient();
  const university = useQuery({ queryKey: ["university", id], queryFn: () => getUniversity(id) });
  const posts = useQuery({ queryKey: ["posts", id], queryFn: () => listPosts(id) });
  const saved = useQuery({
    queryKey: ["saved-universities", user!.id],
    queryFn: () => listSavedUniversities(user!.id),
  });
  const isSaved = saved.data?.some((u) => u.id === id) ?? false;
  const save = useMutation({
    mutationFn: () => setUniversitySaved(id, user!.id, !isSaved),
    onSuccess: () => client.invalidateQueries({ queryKey: ["saved-universities", user!.id] }),
  });
  if (university.isLoading)
    return (
      <AppShell title="University">
        <Loading label="Loading university" />
      </AppShell>
    );
  if (university.error)
    return (
      <AppShell title="University">
        <Failure error={university.error} />
      </AppShell>
    );
  const u = university.data!;
  const programs = u.programs;
  return (
    <AppShell title="University">
      <section className="border-b pb-8">
        <div className="flex flex-wrap items-start gap-4">
          <span className="flex size-16 items-center justify-center rounded-lg bg-primary-soft text-xl font-bold">
            {u.short_name}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-muted-foreground">
              {u.city} · {u.university_type}
            </p>
            <h2 className="mt-1 text-2xl font-bold">{u.name}</h2>
            <p className="mt-3 max-w-3xl whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {u.about || u.description}
            </p>
            {u.website_url ? (
              <a
                href={u.website_url}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary"
              >
                Official website
                <ExternalLink className="size-4" />
              </a>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
              {u.founded_year ? <span>Founded {u.founded_year}</span> : null}
              {u.contact_email ? <a href={`mailto:${u.contact_email}`}>{u.contact_email}</a> : null}
              {u.contact_phone ? <span>{u.contact_phone}</span> : null}
            </div>
          </div>
          <Button
            variant={isSaved ? "default" : "outline"}
            size="icon"
            disabled={save.isPending}
            onClick={() => save.mutate()}
            aria-label={isSaved ? "Remove saved university" : "Save university"}
          >
            <Bookmark className={isSaved ? "size-4 fill-current" : "size-4"} />
          </Button>
        </div>
        <div className="mt-7 grid gap-6 border-t pt-6 md:grid-cols-3">
          <Details title="Departments" values={u.departments.map((d) => d.name)} />
          <Details title="Programs" values={programs.map((program) => program.name)} />
          <Details title="Campuses" values={u.campuses.map((c) => c.name)} />
        </div>
      </section>
      <section className="mt-8">
        <h3 className="text-lg font-bold">Student posts</h3>
        <div className="mt-4 space-y-4">
          {posts.data?.map((post) => (
            <PostCard key={post.id} post={post} userId={user!.id} />
          ))}
          {posts.isSuccess && !posts.data.length ? (
            <Empty
              title="No university posts yet"
              text="Students have not posted about this university."
            />
          ) : null}
        </div>
      </section>
    </AppShell>
  );
}

function Details({ title, values }: { title: string; values: string[] }) {
  return (
    <div>
      <h3 className="font-semibold">{title}</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {values.map((v) => (
          <Badge key={v} variant="secondary">
            {v}
          </Badge>
        ))}
        {!values.length ? (
          <p className="text-sm text-muted-foreground">No published records.</p>
        ) : null}
      </div>
    </div>
  );
}

function QuestionComposer() {
  const { user } = useAuth();
  const client = useQueryClient();
  const universities = useQuery({ queryKey: ["universities"], queryFn: listUniversities });
  const [open, setOpen] = useState(false),
    [title, setTitle] = useState(""),
    [body, setBody] = useState(""),
    [tags, setTags] = useState(""),
    [universityId, setUniversityId] = useState("");
  const mutation = useMutation({
    mutationFn: () =>
      createQuestion({
        authorId: user!.id,
        title,
        body,
        universityId,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
          .slice(0, 5),
      }),
    onSuccess: async () => {
      setOpen(false);
      setTitle("");
      setBody("");
      setTags("");
      setUniversityId("");
      await client.invalidateQueries({ queryKey: ["questions"] });
    },
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Ask a question
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ask the community</DialogTitle>
          <DialogDescription>
            Use a specific title so the right students can answer.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            minLength={8}
            maxLength={240}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Question title"
          />
          <Textarea
            maxLength={4000}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Add useful context"
          />
          <Select value={universityId} onValueChange={setUniversityId}>
            <SelectTrigger>
              <SelectValue placeholder="University (optional)" />
            </SelectTrigger>
            <SelectContent>
              {universities.data?.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Tags separated by commas"
          />
          {mutation.error ? <Failure error={mutation.error} /> : null}
          <Button
            disabled={title.trim().length < 8 || !body.trim() || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "Posting..." : "Post question"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function QuestionsPage() {
  const query = useQuery({ queryKey: ["questions"], queryFn: listQuestions });
  return (
    <AppShell title="Questions">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            Get answers from students with direct experience.
          </p>
          <h2 className="mt-1 text-2xl font-bold">Questions and answers</h2>
        </div>
        <QuestionComposer />
      </div>
      <div className="mt-6 space-y-4">
        {query.isLoading ? <Loading label="Loading questions" /> : null}
        {query.error ? <Failure error={query.error} /> : null}
        {query.data?.map((q) => (
          <article key={q.id} className="card-soft p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold">{q.title}</h3>
                <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{q.body}</p>
              </div>
              <span className="shrink-0 text-sm font-semibold text-primary">
                {q.answers[0]?.count ?? 0} answers
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {q.question_tags.map(({ tag }) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
            <div className="mt-4">
              <AuthorLine profile={q.author} time={q.created_at} />
            </div>
          </article>
        ))}
        {query.isSuccess && !query.data.length ? (
          <Empty title="No questions yet" text="Ask the first question." />
        ) : null}
      </div>
    </AppShell>
  );
}

function ConversationStarter({ onStarted }: { onStarted: (id: string) => void }) {
  const { user } = useAuth();
  const client = useQueryClient();
  const [open, setOpen] = useState(false);
  const [studentId, setStudentId] = useState("");
  const contacts = useQuery({
    queryKey: ["student-contacts", user!.id],
    queryFn: () => listStudentContacts(user!.id),
    enabled: open,
  });
  const start = useMutation({
    mutationFn: () => startDirectConversation(studentId),
    onSuccess: async (id) => {
      await client.invalidateQueries({ queryKey: ["conversations", user!.id] });
      setOpen(false);
      setStudentId("");
      onStarted(id);
    },
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          New conversation
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start a conversation</DialogTitle>
          <DialogDescription>
            Choose a current student with a public TAKKA profile.
          </DialogDescription>
        </DialogHeader>
        {contacts.isLoading ? <Loading label="Loading students" /> : null}
        {contacts.error ? <Failure error={contacts.error} /> : null}
        <Select value={studentId} onValueChange={setStudentId}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a student" />
          </SelectTrigger>
          <SelectContent>
            {contacts.data?.map((contact) => (
              <SelectItem key={contact.profile.id} value={contact.profile.id}>
                {contact.profile.full_name} · {contact.university}
                {contact.department ? " · " + contact.department : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {contacts.isSuccess && !contacts.data.length ? (
          <Empty
            title="No students available"
            text="Current students with public profiles will appear here."
          />
        ) : null}
        {start.error ? <Failure error={start.error} /> : null}
        <Button disabled={!studentId || start.isPending} onClick={() => start.mutate()}>
          {start.isPending ? "Starting..." : "Start conversation"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

export function MessagesPage() {
  const { user } = useAuth();
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["conversations", user!.id],
    queryFn: () => listConversations(user!.id),
  });
  const [selectedId, setSelectedId] = useState(""),
    [message, setMessage] = useState("");
  useEffect(() => {
    const first = query.data?.[0];
    if (!selectedId && first) setSelectedId(first.id);
  }, [query.data, selectedId]);
  useEffect(() => {
    const channel = supabase
      .channel("messages-" + user!.id)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        () => void client.invalidateQueries({ queryKey: ["conversations", user!.id] }),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [client, user]);
  const selected = query.data?.find((c) => c.id === selectedId);
  const send = useMutation({
    mutationFn: () => sendMessage(selected!.id, user!.id, message),
    onSuccess: async () => {
      setMessage("");
      await client.invalidateQueries({ queryKey: ["conversations", user!.id] });
    },
  });
  if (query.isLoading)
    return (
      <AppShell title="Messages">
        <Loading label="Loading conversations" />
      </AppShell>
    );
  if (query.error)
    return (
      <AppShell title="Messages">
        <Failure error={query.error} />
      </AppShell>
    );
  if (!query.data?.length)
    return (
      <AppShell title="Messages">
        <div className="mb-6 flex justify-end">
          <ConversationStarter onStarted={setSelectedId} />
        </div>
        <Empty
          title="No conversations"
          text="Conversations appear here after you connect with another member."
        />
      </AppShell>
    );
  return (
    <AppShell title="Messages">
      <div className="card-soft grid min-h-[620px] overflow-hidden md:grid-cols-[280px_1fr]">
        <aside className="border-b p-3 md:border-b-0 md:border-r">
          <div className="flex items-center justify-between gap-2 px-2 py-2">
            <h2 className="text-lg font-bold">Messages</h2>
            <ConversationStarter onStarted={setSelectedId} />
          </div>
          {query.data.map((c) => {
            const other = c.members.find((m) => m.id !== user!.id) ?? c.members[0];
            return (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={
                  "mt-1 flex w-full items-center gap-3 rounded-lg p-3 text-left " +
                  (selectedId === c.id ? "bg-primary-soft" : "hover:bg-muted")
                }
              >
                {other ? <UserAvatar profile={other} /> : null}
                <span className="truncate text-sm font-semibold">
                  {other?.full_name ?? "Conversation"}
                </span>
              </button>
            );
          })}
        </aside>
        {selected ? (
          <section className="flex min-h-[450px] flex-col">
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {selected.messages.map((m) => (
                <div
                  key={m.id}
                  className={
                    m.sender_id === user!.id
                      ? "ml-auto max-w-[80%] rounded-2xl rounded-br-md bg-primary px-4 py-2 text-sm text-primary-foreground"
                      : "max-w-[80%] rounded-2xl rounded-bl-md bg-muted px-4 py-2 text-sm"
                  }
                >
                  {m.body}
                </div>
              ))}
            </div>
            <div className="flex gap-2 border-t p-3">
              <Textarea
                value={message}
                maxLength={4000}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write a message"
                className="min-h-10 resize-none"
              />
              <Button
                size="icon"
                disabled={!message.trim() || send.isPending}
                onClick={() => send.mutate()}
                aria-label="Send message"
              >
                <Send className="size-4" />
              </Button>
            </div>
          </section>
        ) : null}
      </div>
    </AppShell>
  );
}

export function ProfilePage() {
  const { refreshProfile, user } = useAuth();
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["profile", user!.id],
    queryFn: () => getProfileDetails(user!.id),
  });
  const [editing, setEditing] = useState(false),
    [name, setName] = useState(""),
    [bio, setBio] = useState("");
  useEffect(() => {
    if (query.data) {
      setName(query.data.profile.full_name);
      setBio(query.data.profile.bio ?? "");
    }
  }, [query.data]);
  const save = useMutation({
    mutationFn: () =>
      updateProfile(user!.id, {
        full_name: name.trim(),
        bio: bio.trim() || null,
        is_public: query.data!.profile.is_public,
      }),
    onSuccess: async () => {
      setEditing(false);
      await Promise.all([
        refreshProfile(),
        client.invalidateQueries({ queryKey: ["profile", user!.id] }),
      ]);
    },
  });
  if (query.isLoading)
    return (
      <AppShell title="Profile">
        <Loading label="Loading profile" />
      </AppShell>
    );
  if (query.error)
    return (
      <AppShell title="Profile">
        <Failure error={query.error} />
      </AppShell>
    );
  const profile = query.data!.profile;
  return (
    <AppShell title="Profile">
      <div className="card-soft p-6">
        {editing ? (
          <div className="max-w-xl space-y-4">
            <div>
              <Label htmlFor="profile-name">Full name</Label>
              <Input
                id="profile-name"
                className="mt-1"
                minLength={2}
                maxLength={120}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="profile-bio">Bio</Label>
              <Textarea
                id="profile-bio"
                className="mt-1"
                maxLength={500}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>
            {save.error ? <Failure error={save.error} /> : null}
            <div className="flex gap-2">
              <Button
                disabled={name.trim().length < 2 || save.isPending}
                onClick={() => save.mutate()}
              >
                Save
              </Button>
              <Button variant="outline" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex flex-wrap items-center gap-4">
              <UserAvatar profile={profile} className="size-16" />
              <div>
                <h2 className="text-2xl font-bold">{profile.full_name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {profile.account_type === "current_student"
                    ? "Current university student"
                    : "Prospective university student"}
                </p>
              </div>
              <Button variant="outline" className="ml-auto" onClick={() => setEditing(true)}>
                Edit profile
              </Button>
            </div>
            {profile.bio ? (
              <p className="mt-6 max-w-2xl whitespace-pre-wrap text-sm">{profile.bio}</p>
            ) : (
              <p className="mt-6 text-sm text-muted-foreground">No bio added.</p>
            )}
            <p className="mt-6 border-t pt-5 text-sm text-muted-foreground">{profile.email}</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}

export function SettingsPage() {
  const { profile, refreshProfile, signOut, user } = useAuth();
  const visibility = useMutation({
    mutationFn: () =>
      updateProfile(user!.id, {
        full_name: profile!.full_name,
        bio: profile!.bio,
        is_public: !profile!.is_public,
      }),
    onSuccess: refreshProfile,
  });
  const [resetMessage, setResetMessage] = useState("");
  async function resetPassword() {
    const { error } = await supabase.auth.resetPasswordForEmail(user!.email!, {
      redirectTo: window.location.origin + "/settings",
    });
    setResetMessage(error?.message ?? "Password reset email sent.");
  }
  return (
    <AppShell title="Settings">
      <div className="max-w-2xl">
        <h2 className="text-2xl font-bold">Account settings</h2>
        <div className="mt-6 divide-y border-y">
          <Setting
            title="Profile visibility"
            text={
              profile?.is_public
                ? "Other signed-in members can find your profile."
                : "Your profile is private."
            }
            action={profile?.is_public ? "Make private" : "Make public"}
            run={() => visibility.mutate()}
          />
          <Setting
            title="Password"
            text={resetMessage || "Send a secure password reset link to your email."}
            action="Reset password"
            run={() => void resetPassword()}
          />
          <Setting
            title="Session"
            text={user?.email ?? ""}
            action="Log out"
            run={() => void signOut()}
          />
        </div>
      </div>
    </AppShell>
  );
}

function Setting({
  title,
  text,
  action,
  run,
}: {
  title: string;
  text: string;
  action: string;
  run: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-5">
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{text}</p>
      </div>
      <Button variant="outline" size="sm" onClick={run}>
        {action}
      </Button>
    </div>
  );
}
