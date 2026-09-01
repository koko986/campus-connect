import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { ArrowLeft, LogOut, Plus, Send, Users } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { ProfileLink, UserAvatar } from "@/components/community";
import { Empty, Failure, Loading } from "@/components/states";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import type { ConversationMessage, ConversationSummary } from "@/lib/data";
import {
  getMemberProfile,
  joinUniversityGroup,
  leaveConversation,
  listConversations,
  listMessages,
  listStudentContacts,
  listUniversityGroups,
  markConversationRead,
  sendMessage,
  startDirectConversation,
  subscribeToConversation,
  subscribeToConversationList,
  unsubscribe,
} from "@/lib/data";
import { useT, type Translate } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type MessagePage = { messages: ConversationMessage[]; olderCursor: string | null };
type MessageCache = InfiniteData<MessagePage, string | undefined>;

function conversationLabel(t: Translate, conversation: ConversationSummary, viewerId: string) {
  if (conversation.conversationType === "UNIVERSITY_GROUP") {
    return conversation.title ?? t("messages.group");
  }
  const other = conversation.members.find((member) => member.id !== viewerId);
  return other?.full_name ?? t("messages.conversation");
}

/** Burmese has no plural inflection, so the split matters only for the English catalog. */
function memberCount(t: Translate, count: number) {
  return count === 1
    ? t("messages.memberCountOne", { count })
    : t("messages.memberCount", { count });
}

function ConversationRow({
  conversation,
  viewerId,
  active,
  onSelect,
}: {
  conversation: ConversationSummary;
  viewerId: string;
  active: boolean;
  onSelect: () => void;
}) {
  const t = useT();
  const other = conversation.members.find((member) => member.id !== viewerId);
  const isGroup = conversation.conversationType === "UNIVERSITY_GROUP";
  return (
    <button
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors",
        active ? "bg-primary-soft" : "hover:bg-muted",
      )}
    >
      {isGroup ? (
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary-soft-foreground">
          <Users className="size-5" />
        </span>
      ) : other ? (
        <UserAvatar profile={other} />
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">
          {conversationLabel(t, conversation, viewerId)}
        </span>
        <span className="block truncate text-xs text-muted-foreground">
          {isGroup ? memberCount(t, conversation.memberCount) : t("messages.direct")}
        </span>
      </span>
      {conversation.unreadCount > 0 ? (
        <Badge className="shrink-0 rounded-full px-2">{conversation.unreadCount}</Badge>
      ) : null}
    </button>
  );
}

function ConversationStarter({ onStarted }: { onStarted: (id: string) => void }) {
  const { user } = useAuth();
  const client = useQueryClient();
  const t = useT();
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
      if (id) onStarted(id);
    },
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-9">
          <Plus className="size-4" />
          {t("messages.new")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("messages.start.title")}</DialogTitle>
          <DialogDescription>{t("messages.start.description")}</DialogDescription>
        </DialogHeader>
        {contacts.isLoading ? <Loading label={t("messages.loadingStudents")} /> : null}
        {contacts.error ? <Failure error={contacts.error} /> : null}
        <Select value={studentId} onValueChange={setStudentId}>
          <SelectTrigger>
            <SelectValue placeholder={t("messages.chooseStudent")} />
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
          <Empty title={t("messages.noStudents.title")} text={t("messages.noStudents.text")} />
        ) : null}
        {start.error ? <Failure error={start.error} /> : null}
        <Button
          className="h-11"
          disabled={!studentId || start.isPending}
          onClick={() => start.mutate()}
        >
          {start.isPending ? t("messages.starting") : t("messages.startConversation")}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function GroupDirectory({ onOpenGroup }: { onOpenGroup: (conversationId: string) => void }) {
  const { user } = useAuth();
  const client = useQueryClient();
  const t = useT();

  const groups = useQuery({
    queryKey: ["university-groups", user!.id],
    queryFn: () => listUniversityGroups(user!.id),
  });
  const me = useQuery({
    queryKey: ["member-profile", user!.id],
    queryFn: () => getMemberProfile(user!.id),
  });

  const join = useMutation({
    mutationFn: (universityId: string) => joinUniversityGroup(universityId),
    onSuccess: async (conversationId) => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ["university-groups", user!.id] }),
        client.invalidateQueries({ queryKey: ["conversations", user!.id] }),
      ]);
      toast.success(t("messages.joined"));
      if (conversationId) onOpenGroup(conversationId);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const leave = useMutation({
    mutationFn: (conversationId: string) => leaveConversation(conversationId, user!.id),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ["university-groups", user!.id] }),
        client.invalidateQueries({ queryKey: ["conversations", user!.id] }),
      ]);
      toast.success(t("messages.left"));
    },
    onError: (error: Error) => toast.error(error.message),
  });

  // A current student's own university is the group they most likely want.
  const homeUniversityId = me.data?.student?.university_id ?? null;
  const ordered = useMemo(() => {
    const rows = groups.data ?? [];
    return [...rows].sort((a, b) => {
      if (a.university.id === homeUniversityId) return -1;
      if (b.university.id === homeUniversityId) return 1;
      if (a.joined !== b.joined) return a.joined ? -1 : 1;
      return a.university.name.localeCompare(b.university.name);
    });
  }, [groups.data, homeUniversityId]);

  if (groups.isLoading) return <Loading label={t("messages.loadingGroups")} />;
  if (groups.error) return <Failure error={groups.error} onRetry={() => void groups.refetch()} />;

  return (
    <div className="space-y-2">
      {ordered.map((group) => (
        <div
          key={group.university.id}
          className="flex items-center gap-3 rounded-xl border border-border p-3"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary-soft-foreground">
            {group.university.short_name ?? group.university.name.slice(0, 2)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{group.university.name}</p>
            <p className="text-xs text-muted-foreground">
              {memberCount(t, group.memberCount)}
              {group.university.id === homeUniversityId ? ` · ${t("messages.yourUniversity")}` : ""}
            </p>
          </div>
          {group.joined && group.conversationId ? (
            <div className="flex shrink-0 gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onOpenGroup(group.conversationId!)}
              >
                {t("common.open")}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="size-9"
                aria-label={t("messages.leaveGroup", { name: group.university.name })}
                disabled={leave.isPending}
                onClick={() => leave.mutate(group.conversationId!)}
              >
                <LogOut className="size-4" />
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              className="shrink-0"
              disabled={join.isPending}
              onClick={() => join.mutate(group.university.id)}
            >
              {t("messages.join")}
            </Button>
          )}
        </div>
      ))}
      {!ordered.length ? (
        <Empty title={t("messages.noGroups.title")} text={t("messages.noGroups.text")} />
      ) : null}
    </div>
  );
}

function MessageThread({
  conversation,
  onBack,
}: {
  conversation: ConversationSummary;
  onBack: () => void;
}) {
  const { user } = useAuth();
  const client = useQueryClient();
  const t = useT();
  const [draft, setDraft] = useState("");
  const bottom = useRef<HTMLDivElement>(null);
  const isGroup = conversation.conversationType === "UNIVERSITY_GROUP";
  const cacheKey = useMemo(() => ["messages", conversation.id], [conversation.id]);

  const history = useInfiniteQuery({
    queryKey: cacheKey,
    queryFn: ({ pageParam }) => listMessages(conversation.id, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.olderCursor ?? undefined,
  });

  // Pages arrive newest first, so they are reversed into reading order.
  const messages = useMemo(
    () => [...(history.data?.pages ?? [])].reverse().flatMap((page) => page.messages),
    [history.data],
  );

  useEffect(() => {
    const channel = subscribeToConversation(conversation.id, (incoming) => {
      client.setQueryData<MessageCache>(cacheKey, (old) => {
        if (!old) return old;
        const [newest, ...rest] = old.pages;
        if (!newest || newest.messages.some((message) => message.id === incoming.id)) return old;
        return {
          ...old,
          pages: [
            { ...newest, messages: [...newest.messages, { ...incoming, sender: null }] },
            ...rest,
          ],
        };
      });
      void client.invalidateQueries({ queryKey: ["conversations", user!.id] });
    });
    return () => unsubscribe(channel);
  }, [cacheKey, client, conversation.id, user]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  useEffect(() => {
    void markConversationRead(conversation.id, user!.id).then(() =>
      client.invalidateQueries({ queryKey: ["conversations", user!.id] }),
    );
  }, [client, conversation.id, user]);

  const send = useMutation({
    mutationFn: (body: string) => sendMessage(conversation.id, user!.id, body),
    onSuccess: (saved) => {
      // Reconcile the optimistic row: realtime may have delivered it already.
      client.setQueryData<MessageCache>(cacheKey, (old) => {
        if (!old) return old;
        const [newest, ...rest] = old.pages;
        if (!newest) return old;
        const withoutPending = newest.messages.filter(
          (message) => !message.id.startsWith("pending:") && message.id !== saved.id,
        );
        return { ...old, pages: [{ ...newest, messages: [...withoutPending, saved] }, ...rest] };
      });
      void client.invalidateQueries({ queryKey: ["conversations", user!.id] });
    },
    onError: (error: Error) => {
      client.setQueryData<MessageCache>(cacheKey, (old) => {
        if (!old) return old;
        const [newest, ...rest] = old.pages;
        if (!newest) return old;
        return {
          ...old,
          pages: [
            {
              ...newest,
              messages: newest.messages.filter((message) => !message.id.startsWith("pending:")),
            },
            ...rest,
          ],
        };
      });
      toast.error(error.message);
    },
  });

  function submit() {
    const body = draft.trim();
    if (!body) return;
    setDraft("");
    client.setQueryData<MessageCache>(cacheKey, (old) => {
      if (!old) return old;
      const [newest, ...rest] = old.pages;
      if (!newest) return old;
      const optimistic: ConversationMessage = {
        id: `pending:${crypto.randomUUID()}`,
        body,
        conversation_id: conversation.id,
        created_at: new Date().toISOString(),
        edited_at: null,
        sender_id: user!.id,
        sender: null,
      };
      return {
        ...old,
        pages: [{ ...newest, messages: [...newest.messages, optimistic] }, ...rest],
      };
    });
    send.mutate(body);
  }

  return (
    <section className="flex min-h-[calc(100dvh-12rem)] flex-col md:min-h-[560px]">
      <header className="flex items-center gap-2 border-b p-3">
        <Button
          variant="ghost"
          size="icon"
          className="size-9 md:hidden"
          aria-label={t("messages.back")}
          onClick={onBack}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <h2 className="truncate text-sm font-semibold">
          {conversationLabel(t, conversation, user!.id)}
        </h2>
        {isGroup ? (
          <Badge variant="secondary" className="ml-auto shrink-0 font-normal">
            {memberCount(t, conversation.memberCount)}
          </Badge>
        ) : null}
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto p-3 sm:p-4">
        {history.hasNextPage ? (
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              disabled={history.isFetchingNextPage}
              onClick={() => void history.fetchNextPage()}
            >
              {history.isFetchingNextPage ? t("common.loading") : t("messages.loadOlder")}
            </Button>
          </div>
        ) : null}

        {history.isLoading ? <Loading label={t("messages.loadingMessages")} /> : null}
        {history.error ? <Failure error={history.error} /> : null}

        {messages.map((message) => {
          const mine = message.sender_id === user!.id;
          return (
            <div key={message.id} className={cn("flex gap-2", mine && "justify-end")}>
              {!mine && isGroup && message.sender ? (
                <ProfileLink profile={message.sender} className="mt-auto shrink-0">
                  <UserAvatar profile={message.sender} className="size-7" />
                </ProfileLink>
              ) : null}
              <div className={cn("max-w-[85%] sm:max-w-[75%]", mine && "items-end")}>
                {!mine && isGroup && message.sender ? (
                  <ProfileLink profile={message.sender}>
                    <span className="mb-0.5 block text-xs font-medium text-muted-foreground hover:underline">
                      {message.sender.full_name}
                    </span>
                  </ProfileLink>
                ) : null}
                <div
                  className={cn(
                    "break-words whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm",
                    mine
                      ? "rounded-br-md bg-primary text-primary-foreground"
                      : "rounded-bl-md bg-muted",
                    message.id.startsWith("pending:") && "opacity-60",
                  )}
                >
                  {message.body}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottom} />
      </div>

      <div className="flex gap-2 border-t p-3 pb-safe">
        <Textarea
          value={draft}
          maxLength={4000}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              submit();
            }
          }}
          placeholder={t("messages.draftPlaceholder")}
          className="min-h-11 resize-none"
        />
        <Button
          size="icon"
          className="size-11 shrink-0"
          disabled={!draft.trim()}
          onClick={submit}
          aria-label={t("messages.send")}
        >
          <Send className="size-4" />
        </Button>
      </div>
    </section>
  );
}

export function MessagesPage() {
  const { user } = useAuth();
  const client = useQueryClient();
  const t = useT();
  const [tab, setTab] = useState<"direct" | "groups">("direct");
  const [selectedId, setSelectedId] = useState("");

  const conversations = useQuery({
    queryKey: ["conversations", user!.id],
    queryFn: () => listConversations(user!.id),
  });

  useEffect(() => {
    const channel = subscribeToConversationList(user!.id, () => {
      void client.invalidateQueries({ queryKey: ["conversations", user!.id] });
    });
    return () => unsubscribe(channel);
  }, [client, user]);

  const direct = (conversations.data ?? []).filter((item) => item.conversationType === "DIRECT");
  const groups = (conversations.data ?? []).filter(
    (item) => item.conversationType === "UNIVERSITY_GROUP",
  );
  const selected = conversations.data?.find((item) => item.id === selectedId) ?? null;

  function openConversation(id: string) {
    const conversation = conversations.data?.find((item) => item.id === id);
    if (conversation) setTab(conversation.conversationType === "DIRECT" ? "direct" : "groups");
    setSelectedId(id);
  }

  if (conversations.isLoading) {
    return (
      <AppShell title={t("messages.title")}>
        <Loading label={t("messages.loadingConversations")} />
      </AppShell>
    );
  }

  if (conversations.error) {
    return (
      <AppShell title={t("messages.title")}>
        <Failure error={conversations.error} onRetry={() => void conversations.refetch()} />
      </AppShell>
    );
  }

  return (
    <AppShell title={t("messages.title")}>
      <div className="card-soft grid overflow-hidden md:grid-cols-[300px_1fr]">
        <aside
          className={cn("border-b p-3 md:border-b-0 md:border-r", selected && "hidden md:block")}
        >
          <Tabs value={tab} onValueChange={(next) => setTab(next as "direct" | "groups")}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <TabsList className="grid w-full grid-cols-2 sm:flex-1">
                <TabsTrigger value="direct">{t("messages.tab.direct")}</TabsTrigger>
                <TabsTrigger value="groups">{t("messages.tab.groups")}</TabsTrigger>
              </TabsList>
              {tab === "direct" ? (
                <div className="w-full [&>button]:w-full sm:w-auto sm:[&>button]:w-auto">
                  <ConversationStarter onStarted={openConversation} />
                </div>
              ) : null}
            </div>

            <TabsContent value="direct" className="mt-3 space-y-1">
              {direct.map((conversation) => (
                <ConversationRow
                  key={conversation.id}
                  conversation={conversation}
                  viewerId={user!.id}
                  active={conversation.id === selectedId}
                  onSelect={() => setSelectedId(conversation.id)}
                />
              ))}
              {!direct.length ? (
                <Empty title={t("messages.noDirect.title")} text={t("messages.noDirect.text")} />
              ) : null}
            </TabsContent>

            <TabsContent value="groups" className="mt-3 space-y-4">
              {groups.length ? (
                <div className="space-y-1">
                  {groups.map((conversation) => (
                    <ConversationRow
                      key={conversation.id}
                      conversation={conversation}
                      viewerId={user!.id}
                      active={conversation.id === selectedId}
                      onSelect={() => setSelectedId(conversation.id)}
                    />
                  ))}
                </div>
              ) : null}
              <div>
                <h3 className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("messages.discoverGroups")}
                </h3>
                <div className="mt-2">
                  <GroupDirectory onOpenGroup={openConversation} />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </aside>

        {selected ? (
          <MessageThread conversation={selected} onBack={() => setSelectedId("")} />
        ) : (
          <div className="hidden items-center justify-center p-10 text-sm text-muted-foreground md:flex">
            {t("messages.chooseConversation")}
          </div>
        )}
      </div>
    </AppShell>
  );
}
