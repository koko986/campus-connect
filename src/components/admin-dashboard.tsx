import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  FileText,
  History,
  LayoutDashboard,
  Search,
  ShieldBan,
  Trash2,
  Users,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import { AdminGuard, useAdminIdentity } from "@/components/admin-guard";
import { AppShell } from "@/components/app-shell";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  adminApi,
  type AdminMember,
  type AdminPost,
  type AdminReport,
  type AdminUniversity,
} from "@/lib/admin-api";
import { formatDate } from "@/lib/format";

function QueryState({
  loading,
  error,
  empty,
}: {
  loading: boolean;
  error: Error | null;
  empty?: boolean;
}) {
  if (loading) return <p className="py-12 text-center text-sm text-muted-foreground">Loading...</p>;
  if (error) return <p className="py-12 text-center text-sm text-destructive">{error.message}</p>;
  if (empty)
    return <p className="py-12 text-center text-sm text-muted-foreground">No records found.</p>;
  return null;
}

function Metric({ label, value, icon }: { label: string; value: number; icon: ReactNode }) {
  return (
    <div className="border-b border-r p-5 last:border-r-0">
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-xs font-semibold uppercase">{label}</span>
        {icon}
      </div>
      <p className="mt-3 text-3xl font-bold">{value}</p>
    </div>
  );
}

function Status({ value }: { value: string }) {
  const warning = ["OPEN", "BLOCKED", "REMOVED", "UNPUBLISHED"].includes(value);
  return (
    <Badge variant={warning ? "destructive" : "secondary"}>{value.replaceAll("_", " ")}</Badge>
  );
}

function ActionDialog({
  title,
  description,
  label,
  destructive,
  confirmation,
  onConfirm,
}: {
  title: string;
  description: string;
  label: string;
  destructive?: boolean;
  confirmation?: string;
  onConfirm: (reason: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [typed, setTyped] = useState("");
  const [pending, setPending] = useState(false);
  async function submit() {
    setPending(true);
    try {
      await onConfirm(reason.trim());
      setOpen(false);
      setReason("");
      setTyped("");
      toast.success(`${label} completed`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action failed");
    } finally {
      setPending(false);
    }
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant={destructive ? "destructive" : "outline"}>
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor={`reason-${label}`}>Reason</Label>
            <Textarea
              id={`reason-${label}`}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              maxLength={2000}
              className="mt-1"
            />
          </div>
          {confirmation ? (
            <div>
              <Label htmlFor={`confirm-${label}`}>Enter {confirmation}</Label>
              <Input
                id={`confirm-${label}`}
                value={typed}
                onChange={(event) => setTyped(event.target.value)}
                className="mt-1"
              />
            </div>
          ) : null}
          <Button
            variant={destructive ? "destructive" : "default"}
            disabled={
              reason.trim().length < 3 || pending || Boolean(confirmation && typed !== confirmation)
            }
            onClick={() => void submit()}
          >
            {pending ? "Working..." : label}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function OverviewTab() {
  const query = useQuery({ queryKey: ["admin-overview"], queryFn: adminApi.overview });
  if (!query.data) return <QueryState loading={query.isLoading} error={query.error} />;
  return (
    <div className="overflow-hidden border">
      <div className="grid sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Open reports"
          value={query.data.openReports}
          icon={<AlertTriangle className="size-4" />}
        />
        <Metric label="Members" value={query.data.members} icon={<Users className="size-4" />} />
        <Metric
          label="Blocked"
          value={query.data.blockedMembers}
          icon={<ShieldBan className="size-4" />}
        />
        <Metric
          label="Universities"
          value={query.data.universities}
          icon={<Building2 className="size-4" />}
        />
      </div>
      <div className="grid border-t sm:grid-cols-3">
        <Metric label="Posts" value={query.data.posts} icon={<FileText className="size-4" />} />
        <Metric
          label="Removed posts"
          value={query.data.removedPosts}
          icon={<Trash2 className="size-4" />}
        />
        <Metric
          label="Published universities"
          value={query.data.publishedUniversities}
          icon={<CheckCircle2 className="size-4" />}
        />
      </div>
    </div>
  );
}

function ReportsTab() {
  const client = useQueryClient();
  const [status, setStatus] = useState("OPEN");
  const query = useQuery({
    queryKey: ["admin-reports", status],
    queryFn: () => adminApi.reports(status),
  });
  async function close(report: AdminReport, next: "RESOLVED" | "DISMISSED", notes: string) {
    await adminApi.updateReport(report.id, next, notes);
    await client.invalidateQueries({ queryKey: ["admin-reports"] });
  }
  return (
    <section>
      <div className="mb-4 flex justify-end">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {["OPEN", "REVIEWING", "RESOLVED", "DISMISSED"].map((value) => (
              <SelectItem key={value} value={value}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <QueryState loading={query.isLoading} error={query.error} empty={!query.data?.length} />
      <div className="divide-y border">
        {query.data?.map((report) => (
          <article
            key={report.id}
            className="grid gap-4 p-4 lg:grid-cols-[1fr_180px_220px] lg:items-center"
          >
            <div>
              <div className="flex items-center gap-2">
                <Status value={report.status} />
                <Badge variant="outline">{report.target_type}</Badge>
                <span className="text-xs text-muted-foreground">
                  {formatDate(report.created_at)}
                </span>
              </div>
              <h3 className="mt-2 font-semibold">{report.reason.replaceAll("_", " ")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {report.details || "No additional details."}
              </p>
              <p className="mt-2 line-clamp-2 text-xs">
                {String(
                  report.target_snapshot["full_name"] ??
                    report.target_snapshot["body"] ??
                    report.target_id,
                )}
              </p>
            </div>
            <code className="truncate text-xs text-muted-foreground">{report.target_id}</code>
            {report.status === "OPEN" || report.status === "REVIEWING" ? (
              <div className="flex flex-wrap gap-2">
                <ActionDialog
                  title="Resolve report"
                  description="Close this report after completing the required moderation action."
                  label="Resolve"
                  onConfirm={(reason) => close(report, "RESOLVED", reason)}
                />
                <ActionDialog
                  title="Dismiss report"
                  description="Dismiss reports that do not violate community rules."
                  label="Dismiss"
                  onConfirm={(reason) => close(report, "DISMISSED", reason)}
                />
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}

function MembersTab() {
  const client = useQueryClient();
  const admin = useAdminIdentity();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const query = useQuery({
    queryKey: ["admin-members", search, filter],
    queryFn: () => adminApi.members(search, filter),
  });
  async function refresh() {
    await Promise.all([
      client.invalidateQueries({ queryKey: ["admin-members"] }),
      client.invalidateQueries({ queryKey: ["admin-overview"] }),
    ]);
  }
  return (
    <section>
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative min-w-64 flex-1">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name or email"
            className="pl-9"
          />
        </div>
        <Select
          value={filter || "ALL"}
          onValueChange={(value) => setFilter(value === "ALL" ? "" : value)}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All members</SelectItem>
            <SelectItem value="BLOCKED">Blocked</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <QueryState loading={query.isLoading} error={query.error} empty={!query.data?.length} />
      <div className="overflow-x-auto border">
        <table className="w-full min-w-[860px] text-sm">
          <thead className="border-b bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3">Member</th>
              <th className="p-3">Account</th>
              <th className="p-3">University</th>
              <th className="p-3">Status</th>
              <th className="p-3">Joined</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {query.data?.map((member: AdminMember) => {
              const moderation = member.account_moderation?.[0];
              const blocked = moderation?.status === "BLOCKED";
              return (
                <tr key={member.id}>
                  <td className="p-3">
                    <p className="font-semibold">{member.full_name}</p>
                    <p className="text-xs text-muted-foreground">{member.email}</p>
                  </td>
                  <td className="p-3">{member.account_type.replaceAll("_", " ")}</td>
                  <td className="p-3">
                    {member.student_profiles?.[0]?.universities?.name ?? "Not linked"}
                  </td>
                  <td className="p-3">
                    <Status value={blocked ? "BLOCKED" : "ACTIVE"} />
                  </td>
                  <td className="p-3">{formatDate(member.created_at)}</td>
                  <td className="p-3">
                    <div className="flex justify-end gap-2">
                      {blocked ? (
                        <ActionDialog
                          title="Unblock member"
                          description="Restore this member's access to TAKKA."
                          label="Unblock"
                          onConfirm={async (reason) => {
                            await adminApi.memberAction(member.id, "unblock", reason);
                            await refresh();
                          }}
                        />
                      ) : (
                        <ActionDialog
                          title="Block member"
                          description="Suspend authentication and all write access immediately."
                          label="Block"
                          destructive
                          onConfirm={async (reason) => {
                            await adminApi.memberAction(member.id, "block", reason);
                            await refresh();
                          }}
                        />
                      )}
                      {admin.data?.role === "SUPER_ADMIN" ? (
                        <ActionDialog
                          title="Delete account"
                          description="Personal data and login access will be removed. Community content remains under Deleted user."
                          label="Delete"
                          destructive
                          confirmation={member.email}
                          onConfirm={async (reason) => {
                            await adminApi.deleteMember(member.id, reason);
                            await refresh();
                          }}
                        />
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function PostsTab() {
  const client = useQueryClient();
  const [status, setStatus] = useState("");
  const query = useQuery({
    queryKey: ["admin-posts", status],
    queryFn: () => adminApi.posts(status),
  });
  async function act(post: AdminPost, action: "remove" | "restore", reason: string) {
    await adminApi.postAction(post.id, action, reason);
    await Promise.all([
      client.invalidateQueries({ queryKey: ["admin-posts"] }),
      client.invalidateQueries({ queryKey: ["admin-overview"] }),
    ]);
  }
  return (
    <section>
      <div className="mb-4 flex justify-end">
        <Select
          value={status || "ALL"}
          onValueChange={(value) => setStatus(value === "ALL" ? "" : value)}
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All posts</SelectItem>
            <SelectItem value="PUBLISHED">Published</SelectItem>
            <SelectItem value="REMOVED">Removed</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <QueryState loading={query.isLoading} error={query.error} empty={!query.data?.length} />
      <div className="divide-y border">
        {query.data?.map((post) => (
          <article
            key={post.id}
            className="grid gap-4 p-4 lg:grid-cols-[1fr_160px_140px] lg:items-center"
          >
            <div>
              <div className="flex gap-2">
                <Status value={post.moderation_status} />
                {post.report_count ? (
                  <Badge variant="destructive">{post.report_count} reports</Badge>
                ) : null}
              </div>
              <p className="mt-2 line-clamp-3 text-sm">{post.body}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {post.profiles?.full_name ?? "Deleted user"} · {formatDate(post.created_at)}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">{post.removal_reason}</p>
            <div className="flex justify-end">
              {post.moderation_status === "REMOVED" ? (
                <ActionDialog
                  title="Restore post"
                  description="Return this post to the community feed."
                  label="Restore"
                  onConfirm={(reason) => act(post, "restore", reason)}
                />
              ) : (
                <ActionDialog
                  title="Remove post"
                  description="Hide this post while retaining it for review and audit."
                  label="Remove"
                  destructive
                  onConfirm={(reason) => act(post, "remove", reason)}
                />
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function UniversityDialog({
  university,
  onSaved,
}: {
  university?: AdminUniversity;
  onSaved: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: university?.name ?? "",
    shortName: university?.short_name ?? "",
    slug: university?.slug ?? "",
    city: university?.city ?? "",
    description: university?.description ?? "",
    websiteUrl: university?.website_url ?? "",
    universityType: university?.university_type ?? "public",
  });
  const save = useMutation({
    mutationFn: () =>
      adminApi.saveUniversity(
        { ...form, countryCode: "MM", published: university?.is_published ?? false },
        university?.id,
      ),
    onSuccess: async () => {
      await onSaved();
      setOpen(false);
      toast.success("University saved");
    },
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant={university ? "outline" : "default"}>
          {university ? "Edit" : "Add university"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{university ? "Edit university" : "Add university"}</DialogTitle>
          <DialogDescription>Maintain the official TAKKA university directory.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label>Short name</Label>
            <Input
              value={form.shortName}
              onChange={(e) => setForm({ ...form, shortName: e.target.value })}
            />
          </div>
          <div>
            <Label>Slug</Label>
            <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          </div>
          <div>
            <Label>City</Label>
            <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <Label>Website</Label>
            <Input
              value={form.websiteUrl}
              onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
        </div>
        {save.error ? <p className="text-sm text-destructive">{save.error.message}</p> : null}
        <Button
          disabled={
            !form.name ||
            !form.shortName ||
            !form.slug ||
            !form.city ||
            !form.description ||
            save.isPending
          }
          onClick={() => save.mutate()}
        >
          {save.isPending ? "Saving..." : "Save university"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function UniversitiesTab() {
  const client = useQueryClient();
  const query = useQuery({ queryKey: ["admin-universities"], queryFn: adminApi.universities });
  async function refresh() {
    await Promise.all([
      client.invalidateQueries({ queryKey: ["admin-universities"] }),
      client.invalidateQueries({ queryKey: ["admin-overview"] }),
    ]);
  }
  async function action(
    university: AdminUniversity,
    operation: "publish" | "unpublish" | "archive",
    reason: string,
  ) {
    await adminApi.universityAction(university.id, operation, reason);
    await refresh();
  }
  return (
    <section>
      <div className="mb-4 flex justify-end">
        <UniversityDialog onSaved={refresh} />
      </div>
      <QueryState loading={query.isLoading} error={query.error} empty={!query.data?.length} />
      <div className="overflow-x-auto border">
        <table className="w-full min-w-[850px] text-sm">
          <thead className="border-b bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3">University</th>
              <th className="p-3">Catalog</th>
              <th className="p-3">Status</th>
              <th className="p-3">Source</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {query.data?.map((university) => (
              <tr key={university.id}>
                <td className="p-3">
                  <p className="font-semibold">{university.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {university.city} · {university.short_name}
                  </p>
                </td>
                <td className="p-3 text-xs">
                  {university.campuses?.[0]?.count ?? 0} campuses ·{" "}
                  {university.departments?.[0]?.count ?? 0} departments ·{" "}
                  {university.programs?.[0]?.count ?? 0} programs
                </td>
                <td className="p-3">
                  <Status
                    value={
                      university.archived_at
                        ? "ARCHIVED"
                        : university.is_published
                          ? "PUBLISHED"
                          : "UNPUBLISHED"
                    }
                  />
                </td>
                <td className="p-3">
                  <a
                    href={university.website_url ?? "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline"
                  >
                    Official site
                  </a>
                </td>
                <td className="p-3">
                  <div className="flex justify-end gap-2">
                    <UniversityDialog university={university} onSaved={refresh} />
                    {university.is_published ? (
                      <ActionDialog
                        title="Unpublish university"
                        description="Hide this university from public discovery."
                        label="Unpublish"
                        onConfirm={(reason) => action(university, "unpublish", reason)}
                      />
                    ) : (
                      <ActionDialog
                        title="Publish university"
                        description="Make this university visible in public discovery."
                        label="Publish"
                        onConfirm={(reason) => action(university, "publish", reason)}
                      />
                    )}
                    <ActionDialog
                      title="Archive university"
                      description="Hide this university and retain its catalog history."
                      label="Archive"
                      destructive
                      onConfirm={(reason) => action(university, "archive", reason)}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function AuditTab() {
  const query = useQuery({ queryKey: ["admin-audit"], queryFn: adminApi.audit });
  return (
    <section>
      <QueryState loading={query.isLoading} error={query.error} empty={!query.data?.length} />
      <div className="divide-y border">
        {query.data?.map((action) => (
          <div key={action.id} className="grid gap-2 p-4 sm:grid-cols-[180px_1fr_180px]">
            <div>
              <Status value={action.action} />
              <p className="mt-2 text-xs text-muted-foreground">{formatDate(action.created_at)}</p>
            </div>
            <div>
              <p className="text-sm font-semibold">{action.admin_email}</p>
              <p className="mt-1 text-sm text-muted-foreground">{action.reason}</p>
            </div>
            <code className="truncate text-xs text-muted-foreground">
              {action.target_type}: {action.target_id}
            </code>
          </div>
        ))}
      </div>
    </section>
  );
}

export function AdminDashboard() {
  return (
    <AppShell title="Administration">
      <AdminGuard>
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">
            Community operations and directory governance
          </p>
          <h2 className="mt-1 text-2xl font-bold">TAKKA administration</h2>
        </div>
        <Tabs defaultValue="overview">
          <TabsList className="mb-5 h-auto w-full justify-start overflow-x-auto rounded-none border-b bg-transparent p-0">
            {[
              { value: "overview", label: "Overview", icon: LayoutDashboard },
              { value: "reports", label: "Reports", icon: AlertTriangle },
              { value: "members", label: "Members", icon: Users },
              { value: "posts", label: "Posts", icon: FileText },
              { value: "universities", label: "Universities", icon: Building2 },
              { value: "audit", label: "Audit log", icon: History },
            ].map((item) => (
              <TabsTrigger
                key={item.value}
                value={item.value}
                className="gap-2 rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:shadow-none"
              >
                <item.icon className="size-4" />
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="overview">
            <OverviewTab />
          </TabsContent>
          <TabsContent value="reports">
            <ReportsTab />
          </TabsContent>
          <TabsContent value="members">
            <MembersTab />
          </TabsContent>
          <TabsContent value="posts">
            <PostsTab />
          </TabsContent>
          <TabsContent value="universities">
            <UniversitiesTab />
          </TabsContent>
          <TabsContent value="audit">
            <AuditTab />
          </TabsContent>
        </Tabs>
      </AdminGuard>
    </AppShell>
  );
}
