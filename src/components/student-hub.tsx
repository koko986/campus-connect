import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Bookmark,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  GraduationCap,
  MapPin,
  MessageCircle,
  Search,
  Send,
  SlidersHorizontal,
  Sparkles,
  UserRoundSearch,
  UsersRound,
  X,
} from "lucide-react";
import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { UniversityCard, UserAvatar } from "@/components/community";
import { MessagesWorkspace } from "@/components/messages";
import { Empty, Failure, Loading } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { useAuth } from "@/lib/auth";
import {
  getMemberProfile,
  listFieldOfStudyOptions,
  listSavedUniversities,
  setUniversitySaved,
} from "@/lib/data";
import { formatDate } from "@/lib/format";
import {
  buddyStudent,
  dismissBuddy,
  getBuddyProfile,
  getMatcherPreferences,
  listBuddyMatches,
  listBuddyRequests,
  listOpportunities,
  listOwnOpportunitySubmissions,
  listSmartMatches,
  listUniversityLocations,
  loadUniversityComparison,
  respondToBuddyRequest,
  saveBuddyProfile,
  saveMatcherPreferences,
  sendBuddyRequest,
  setOpportunityBookmarked,
  submitOpportunity,
  type BuddyMatch,
  type BuddyProfileInput,
  type BuddyRequest,
  type MatcherPreferences,
  type Opportunity,
  type OpportunityType,
  type SmartMatch,
} from "@/lib/hub-data";
import { useLanguage, useT, type TranslationKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type HubTab = "decide" | "opportunities" | "connect";

const defaultPreferences = (userId: string): MatcherPreferences => ({
  user_id: userId,
  preferred_field: null,
  preferred_city: null,
  preferred_degree_level: null,
  preferred_university_type: null,
  field_weight: 3,
  city_weight: 2,
  degree_weight: 3,
  type_weight: 1,
});

const opportunityTypes: OpportunityType[] = [
  "scholarship",
  "internship",
  "competition",
  "workshop",
  "event",
];
const degreeLevels = ["Bachelor", "Master", "Doctorate", "Diploma"];
const availabilityOptions = ["weekday_morning", "weekday_afternoon", "weekday_evening", "weekend"];
const languageOptions = ["Myanmar", "English"];
const fallbackFields = [
  "Agriculture",
  "Arts and Humanities",
  "Business Administration",
  "Computer Science",
  "Economics",
  "Education",
  "Engineering",
  "Law",
  "Medicine",
  "Social Sciences",
];
const fallbackLocations = [
  "Yangon",
  "Mandalay",
  "Nay Pyi Taw",
  "Taunggyi",
  "Mawlamyine",
  "Pathein",
  "Monywa",
  "Meiktila",
];

function SectionHeading({
  icon: Icon,
  eyebrow,
  title,
  text,
  action,
}: {
  icon: typeof Sparkles;
  eyebrow: string;
  title: string;
  text: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        <p className="flex items-center gap-2 text-xs font-bold uppercase text-primary">
          <Icon aria-hidden="true" className="size-4" /> {eyebrow}
        </p>
        <h2 className="mt-2 text-2xl font-bold sm:text-3xl">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
      </div>
      {action}
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

function WeightControl({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  const t = useT();
  return (
    <fieldset>
      <legend className="text-sm font-medium">{label}</legend>
      <div className="mt-2 grid grid-cols-5 gap-2" aria-label={label}>
        {[1, 2, 3, 4, 5].map((weight) => (
          <button
            key={weight}
            type="button"
            aria-pressed={value === weight}
            onClick={() => onChange(weight)}
            className={cn(
              "min-h-11 rounded-md border text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              value === weight
                ? "border-primary bg-primary text-primary-foreground"
                : "bg-background hover:bg-muted",
            )}
          >
            {weight}
          </button>
        ))}
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">
        {value <= 2
          ? t("hub.matcher.priorityLow")
          : value >= 4
            ? t("hub.matcher.priorityHigh")
            : t("hub.matcher.priorityMedium")}
      </p>
    </fieldset>
  );
}

export function StudentHubPage({
  initialTab = "decide",
  initialCompareIds = [],
}: {
  initialTab?: HubTab;
  initialCompareIds?: string[];
}) {
  const t = useT();
  const navigate = useNavigate();
  const [tab, setTab] = useState<HubTab>(initialTab);
  const [compareIds, setCompareIds] = useState<string[]>(initialCompareIds);
  const changeTab = (value: HubTab) => {
    setTab(value);
    void navigate({
      to: "/hub",
      search: { tab: value, compare: compareIds.length ? compareIds.join(",") : undefined },
      replace: true,
    });
  };
  const changeComparison = (ids: string[]) => {
    setCompareIds(ids);
    void navigate({
      to: "/hub",
      search: { tab: "decide", compare: ids.length ? ids.join(",") : undefined },
      replace: true,
    });
  };
  return (
    <AppShell title={t("hub.title")}>
      <header className="mb-6 border-b pb-6">
        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
          <Sparkles aria-hidden="true" className="size-4" />
          {t("hub.eyebrow")}
        </div>
        <h1 className="mt-2 max-w-3xl text-3xl font-bold sm:text-4xl">{t("hub.heading")}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{t("hub.note")}</p>
      </header>
      <Tabs value={tab} onValueChange={(value) => changeTab(value as HubTab)}>
        <TabsList className="grid h-auto w-full grid-cols-3 rounded-lg border bg-muted/60 p-1">
          <TabsTrigger value="decide" className="min-h-12 gap-2 px-2">
            <GraduationCap aria-hidden="true" className="size-4" />
            <span className="hidden sm:inline">{t("hub.tab.decide")}</span>
            <span className="sm:hidden">{t("hub.tab.decideShort")}</span>
          </TabsTrigger>
          <TabsTrigger value="opportunities" className="min-h-12 gap-2 px-2">
            <BriefcaseBusiness aria-hidden="true" className="size-4" />
            <span className="hidden sm:inline">{t("hub.tab.opportunities")}</span>
            <span className="sm:hidden">{t("hub.tab.opportunitiesShort")}</span>
          </TabsTrigger>
          <TabsTrigger value="connect" className="min-h-12 gap-2 px-2">
            <UsersRound aria-hidden="true" className="size-4" />
            <span>{t("hub.tab.connect")}</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="decide" className="mt-8">
          <DecisionCenter compareIds={compareIds} onCompareIdsChange={changeComparison} />
        </TabsContent>
        <TabsContent value="opportunities" className="mt-8">
          <OpportunitiesBoard />
        </TabsContent>
        <TabsContent value="connect" className="mt-8">
          <ConnectCenter />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

function ConnectCenter() {
  const t = useT();
  return (
    <Tabs defaultValue="messages">
      <TabsList className="grid h-auto w-full grid-cols-2 rounded-lg border bg-muted/60 p-1 sm:max-w-md">
        <TabsTrigger value="messages" className="min-h-11 gap-2">
          <MessageCircle aria-hidden="true" className="size-4" />
          {t("hub.connect.messages")}
        </TabsTrigger>
        <TabsTrigger value="buddies" className="min-h-11 gap-2">
          <UserRoundSearch aria-hidden="true" className="size-4" />
          {t("hub.connect.buddies")}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="messages" className="mt-6">
        <MessagesWorkspace initialConversationId={undefined} />
      </TabsContent>
      <TabsContent value="buddies" className="mt-6">
        <StudyBuddy />
      </TabsContent>
    </Tabs>
  );
}

function DecisionCenter({
  compareIds,
  onCompareIdsChange,
}: {
  compareIds: string[];
  onCompareIdsChange: (ids: string[]) => void;
}) {
  const { user } = useAuth();
  const t = useT();
  const client = useQueryClient();
  const [preferences, setPreferences] = useState(() => defaultPreferences(user!.id));
  const fields = useQuery({
    queryKey: ["field-options"],
    queryFn: listFieldOfStudyOptions,
    retry: false,
    staleTime: 5 * 60_000,
  });
  const locations = useQuery({
    queryKey: ["university-locations"],
    queryFn: listUniversityLocations,
    retry: false,
    staleTime: 5 * 60_000,
  });
  const shortlist = useQuery({
    queryKey: ["saved-universities", user!.id],
    queryFn: () => listSavedUniversities(user!.id),
  });
  const stored = useQuery({
    queryKey: ["matcher-preferences", user!.id],
    queryFn: () => getMatcherPreferences(user!.id),
    retry: false,
  });
  useEffect(() => {
    if (stored.data) setPreferences(stored.data);
  }, [stored.data]);
  const hasPreference = Boolean(
    preferences.preferred_field ||
    preferences.preferred_city ||
    preferences.preferred_degree_level ||
    preferences.preferred_university_type,
  );
  const matches = useQuery({
    queryKey: ["smart-matches", preferences],
    queryFn: () => listSmartMatches(preferences),
    enabled: Boolean(stored.data && hasPreference),
  });
  const compareKey = compareIds.join(",");
  const comparison = useQuery({
    queryKey: ["university-comparison", compareKey],
    queryFn: () => loadUniversityComparison(compareIds),
    enabled: compareIds.length >= 2,
  });
  const comparisonRef = useRef<HTMLElement | null>(null);
  const save = useMutation({
    mutationFn: () => saveMatcherPreferences(preferences),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["matcher-preferences", user!.id] });
      await client.invalidateQueries({ queryKey: ["smart-matches"] });
      toast.success(t("hub.matcher.saved"));
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const saveUniversity = useMutation({
    mutationFn: ({ id, saved }: { id: string; saved: boolean }) =>
      setUniversitySaved(id, user!.id, saved),
    onSuccess: () => client.invalidateQueries({ queryKey: ["saved-universities", user!.id] }),
    onError: (error: Error) => toast.error(error.message),
  });
  const set = <K extends keyof MatcherPreferences>(key: K, value: MatcherPreferences[K]) =>
    setPreferences((current) => ({ ...current, [key]: value }));
  const toggleCompare = (id: string) =>
    onCompareIdsChange(
      compareIds.includes(id)
        ? compareIds.filter((item) => item !== id)
        : compareIds.length < 3
          ? [...compareIds, id]
          : compareIds,
    );
  const fieldOptions = fields.data?.length ? fields.data : fallbackFields;
  const locationOptions = locations.data?.length ? locations.data : fallbackLocations;
  const optionsUnavailable = fields.isError || locations.isError;

  return (
    <div className="space-y-8">
      <SectionHeading
        icon={SlidersHorizontal}
        eyebrow={t("hub.matcher.eyebrow")}
        title={t("hub.matcher.title")}
        text={t("hub.matcher.text")}
      />
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="grid gap-5 sm:grid-cols-2">
          {optionsUnavailable ? (
            <div className="sm:col-span-2">
              <Failure
                error={new Error(t("hub.matcher.optionsFallback"))}
                onRetry={() => {
                  void fields.refetch();
                  void locations.refetch();
                }}
              />
            </div>
          ) : null}
          <Field label={t("field.preferredField")} htmlFor="matcher-field">
            <Select
              value={preferences.preferred_field ?? "none"}
              onValueChange={(value) => set("preferred_field", value === "none" ? null : value)}
            >
              <SelectTrigger id="matcher-field" className="min-h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("hub.any")}</SelectItem>
                {fieldOptions.map((field) => (
                  <SelectItem key={field} value={field}>
                    {field}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label={t("field.preferredLocation")} htmlFor="matcher-city">
            <Select
              value={preferences.preferred_city ?? "none"}
              onValueChange={(value) => set("preferred_city", value === "none" ? null : value)}
            >
              <SelectTrigger id="matcher-city" className="min-h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("hub.any")}</SelectItem>
                {locationOptions.map((region) => (
                  <SelectItem key={region} value={region}>
                    {region}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label={t("field.preferredDegreeLevel")} htmlFor="matcher-degree">
            <Select
              value={preferences.preferred_degree_level ?? "none"}
              onValueChange={(value) =>
                set("preferred_degree_level", value === "none" ? null : value)
              }
            >
              <SelectTrigger id="matcher-degree" className="min-h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("hub.any")}</SelectItem>
                {degreeLevels.map((degree) => (
                  <SelectItem key={degree} value={degree}>
                    {degree}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label={t("hub.matcher.universityType")} htmlFor="matcher-type">
            <Select
              value={preferences.preferred_university_type ?? "none"}
              onValueChange={(value) =>
                set(
                  "preferred_university_type",
                  value === "none" ? null : (value as "public" | "private"),
                )
              }
            >
              <SelectTrigger id="matcher-type" className="min-h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("hub.any")}</SelectItem>
                <SelectItem value="public">{t("hub.public")}</SelectItem>
                <SelectItem value="private">{t("hub.private")}</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
        <div className="rounded-lg border bg-muted/30 p-4">
          <p className="text-sm font-semibold">{t("hub.matcher.priorities")}</p>
          <div className="mt-4 space-y-4">
            <WeightControl
              label={t("hub.matcher.fieldPriority")}
              value={preferences.field_weight}
              onChange={(value) => set("field_weight", value)}
            />
            <WeightControl
              label={t("hub.matcher.locationPriority")}
              value={preferences.city_weight}
              onChange={(value) => set("city_weight", value)}
            />
          </div>
        </div>
      </section>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          className="min-h-11 gap-2"
          disabled={!hasPreference || save.isPending}
          onClick={() => save.mutate()}
        >
          <Sparkles aria-hidden="true" className="size-4" />
          {save.isPending ? t("common.saving") : t("hub.matcher.find")}
        </Button>
        <p className="text-xs text-muted-foreground">{t("hub.matcher.hint")}</p>
      </div>
      {stored.error ? <Failure error={stored.error} onRetry={() => void stored.refetch()} /> : null}
      {matches.isLoading ? <Loading label={t("hub.matcher.loading")} /> : null}
      {matches.error ? (
        <Failure error={matches.error} onRetry={() => void matches.refetch()} />
      ) : null}
      {matches.data?.length ? (
        <MatchResults
          matches={matches.data}
          compareIds={compareIds}
          savedIds={new Set(shortlist.data?.map((item) => item.id) ?? [])}
          onCompare={toggleCompare}
          onSave={(id, saved) => saveUniversity.mutate({ id, saved })}
          saveBusy={saveUniversity.isPending}
        />
      ) : null}
      {matches.isSuccess && stored.data && !matches.data.length ? (
        <Empty title={t("hub.matcher.emptyTitle")} text={t("hub.matcher.emptyText")} />
      ) : null}
      {compareIds.length ? (
        <ComparisonTray
          selected={compareIds.map((id) => ({
            id,
            name:
              matches.data?.find((match) => match.id === id)?.short_name ??
              comparison.data?.find((university) => university.id === id)?.short_name ??
              t("hub.compare.selected"),
          }))}
          canView={compareIds.length >= 2}
          onView={() =>
            comparisonRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
          }
          onClear={() => onCompareIdsChange([])}
          onRemove={toggleCompare}
        />
      ) : null}
      {comparison.isLoading ? <Loading label={t("hub.compare.loading")} /> : null}
      {comparison.data ? (
        <ComparisonTable
          ref={comparisonRef}
          universities={comparison.data}
          onRemove={(id) => toggleCompare(id)}
        />
      ) : null}
    </div>
  );
}

function ComparisonTray({
  selected,
  canView,
  onView,
  onClear,
  onRemove,
}: {
  selected: Array<{ id: string; name: string }>;
  canView: boolean;
  onView: () => void;
  onClear: () => void;
  onRemove: (id: string) => void;
}) {
  const t = useT();
  return (
    <section className="rounded-lg border bg-primary-soft/25 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold">{t("hub.compare.selectedTitle")}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {canView ? t("hub.compare.ready") : t("hub.compare.chooseMore")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" className="min-h-11" onClick={onClear}>
            {t("hub.compare.clear")}
          </Button>
          <Button type="button" size="sm" className="min-h-11" disabled={!canView} onClick={onView}>
            {t("hub.compare.view")}
          </Button>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {selected.map((item) => (
          <Badge key={item.id} variant="secondary" className="gap-1.5 py-1.5">
            {item.name}
            <button
              type="button"
              className="rounded-full p-0.5 hover:bg-background"
              aria-label={t("hub.compare.remove", { name: item.name })}
              onClick={() => onRemove(item.id)}
            >
              <X aria-hidden="true" className="size-3.5" />
            </button>
          </Badge>
        ))}
      </div>
    </section>
  );
}

function MatchResults({
  matches,
  compareIds,
  savedIds,
  onCompare,
  onSave,
  saveBusy,
}: {
  matches: SmartMatch[];
  compareIds: string[];
  savedIds: Set<string>;
  onCompare: (id: string) => void;
  onSave: (id: string, saved: boolean) => void;
  saveBusy: boolean;
}) {
  const t = useT();
  return (
    <section aria-labelledby="match-results">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h3 id="match-results" className="text-xl font-bold">
            {t("hub.matcher.results")}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">{t("hub.matcher.resultsText")}</p>
        </div>
        <Badge variant="outline">{t("hub.compare.count", { count: compareIds.length })}</Badge>
      </div>
      <div className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {matches.map((match) => (
          <div key={match.id} className="min-w-0">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <span className="text-2xl font-bold text-primary">{match.score}%</span>
                <span className="ml-1 text-xs text-muted-foreground">{t("hub.matcher.match")}</span>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-11"
                  aria-label={t(
                    savedIds.has(match.id) ? "hub.shortlist.remove" : "hub.shortlist.save",
                    { name: match.name },
                  )}
                  aria-pressed={savedIds.has(match.id)}
                  disabled={saveBusy}
                  onClick={() => onSave(match.id, !savedIds.has(match.id))}
                >
                  <Bookmark
                    aria-hidden="true"
                    className={cn("size-4", savedIds.has(match.id) && "fill-current")}
                  />
                </Button>
                <Button
                  type="button"
                  variant={compareIds.includes(match.id) ? "default" : "outline"}
                  size="sm"
                  className="min-h-11 gap-2"
                  aria-pressed={compareIds.includes(match.id)}
                  disabled={!compareIds.includes(match.id) && compareIds.length >= 3}
                  onClick={() => onCompare(match.id)}
                >
                  {compareIds.includes(match.id) ? (
                    <Check aria-hidden="true" className="size-4" />
                  ) : (
                    <GraduationCap aria-hidden="true" className="size-4" />
                  )}
                  {t("hub.compare.action")}
                </Button>
              </div>
            </div>
            <UniversityCard university={match} />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {match.reasons.map((reason) => (
                <Badge key={reason} variant="secondary">
                  {t(`hub.reason.${reason}` as TranslationKey)}
                </Badge>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

const ComparisonTable = forwardRef<
  HTMLElement,
  {
    universities: Awaited<ReturnType<typeof loadUniversityComparison>>;
    onRemove: (id: string) => void;
  }
>(function ComparisonTable({ universities, onRemove }, ref) {
  const t = useT();
  const rows = [
    [
      t("hub.compare.location"),
      (u: (typeof universities)[number]) => `${u.city}${u.region ? `, ${u.region}` : ""}`,
    ],
    [
      t("hub.compare.type"),
      (u: (typeof universities)[number]) =>
        t(u.university_type === "public" ? "hub.public" : "hub.private"),
    ],
    [
      t("hub.compare.founded"),
      (u: (typeof universities)[number]) => u.founded_year ?? t("common.notAdded"),
    ],
    [t("hub.compare.campuses"), (u: (typeof universities)[number]) => u.campuses.length],
    [t("hub.compare.departments"), (u: (typeof universities)[number]) => u.departments.length],
    [t("hub.compare.programs"), (u: (typeof universities)[number]) => u.programs.length],
  ] as const;
  return (
    <section ref={ref} aria-labelledby="comparison-title" className="scroll-mt-24">
      <div className="flex items-center justify-between">
        <div>
          <h3 id="comparison-title" className="text-xl font-bold">
            {t("hub.compare.title")}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">{t("hub.compare.text")}</p>
        </div>
      </div>
      <div className="mt-4 overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[42rem] border-collapse text-left text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th className="sticky left-0 z-10 w-36 bg-muted px-4 py-3 font-medium text-muted-foreground">
                {t("hub.compare.detail")}
              </th>
              {universities.map((u) => (
                <th key={u.id} className="min-w-48 px-4 py-3 align-top">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold">{u.short_name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-11"
                      aria-label={t("hub.compare.remove", { name: u.name })}
                      onClick={() => onRemove(u.id)}
                    >
                      <X aria-hidden="true" className="size-4" />
                    </Button>
                  </div>
                  <span className="mt-1 block text-xs font-normal text-muted-foreground">
                    {u.name}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, read]) => (
              <tr key={label} className="border-t">
                <th className="sticky left-0 bg-background px-4 py-3 font-medium text-muted-foreground">
                  {label}
                </th>
                {universities.map((u) => (
                  <td key={u.id} className="px-4 py-3 font-medium">
                    {read(u)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t bg-muted/30">
              <th className="sticky left-0 bg-muted px-4 py-3" />
              {universities.map((u) => (
                <td key={u.id} className="px-4 py-3">
                  <Button asChild size="sm" className="w-full">
                    <Link to="/universities/$id" params={{ id: u.id }}>
                      {t("common.view")}
                    </Link>
                  </Button>
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
});

function OpportunitiesBoard() {
  const { user } = useAuth();
  const t = useT();
  const client = useQueryClient();
  const [search, setSearch] = useState("");
  const [type, setType] = useState<OpportunityType | "all">("all");
  const [deadline, setDeadline] = useState<"all" | "7" | "30">("all");
  const [savedOnly, setSavedOnly] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const opportunities = useQuery({
    queryKey: ["opportunities", user!.id],
    queryFn: () => listOpportunities(user!.id),
  });
  const submissions = useQuery({
    queryKey: ["opportunity-submissions", user!.id],
    queryFn: () => listOwnOpportunitySubmissions(user!.id),
  });
  const bookmark = useMutation({
    mutationFn: ({ id, saved }: { id: string; saved: boolean }) =>
      setOpportunityBookmarked(user!.id, id, saved),
    onSuccess: () => client.invalidateQueries({ queryKey: ["opportunities", user!.id] }),
    onError: (error: Error) => toast.error(error.message),
  });
  const visible = useMemo(
    () =>
      opportunities.data?.filter((item) => {
        const daysRemaining =
          (new Date(item.deadline_at).getTime() - Date.now()) / (24 * 60 * 60 * 1000);
        return (
          (type === "all" || item.opportunity_type === type) &&
          (deadline === "all" || daysRemaining <= Number(deadline)) &&
          (!savedOnly || item.bookmarked) &&
          `${item.title} ${item.organization} ${item.location ?? ""} ${item.university?.name ?? ""}`
            .toLowerCase()
            .includes(search.toLowerCase())
        );
      }) ?? [],
    [deadline, opportunities.data, savedOnly, search, type],
  );
  return (
    <div className="space-y-8">
      <SectionHeading
        icon={BriefcaseBusiness}
        eyebrow={t("hub.opportunities.eyebrow")}
        title={t("hub.opportunities.title")}
        text={t("hub.opportunities.text")}
        action={
          <Button className="min-h-11 gap-2" onClick={() => setSubmitOpen(true)}>
            <Send aria-hidden="true" className="size-4" />
            {t("hub.opportunities.submit")}
          </Button>
        }
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_12rem_11rem_auto]">
        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground"
          />
          <Input
            aria-label={t("hub.opportunities.search")}
            className="min-h-11 pl-9"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("hub.opportunities.search")}
          />
        </div>
        <Select value={type} onValueChange={(value) => setType(value as typeof type)}>
          <SelectTrigger className="min-h-11">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("hub.opportunities.all")}</SelectItem>
            {opportunityTypes.map((value) => (
              <SelectItem key={value} value={value}>
                {t(`hub.opportunityType.${value}` as TranslationKey)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={deadline} onValueChange={(value) => setDeadline(value as typeof deadline)}>
          <SelectTrigger className="min-h-11" aria-label={t("hub.opportunities.deadlineFilter")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("hub.opportunities.anyDeadline")}</SelectItem>
            <SelectItem value="7">{t("hub.opportunities.next7Days")}</SelectItem>
            <SelectItem value="30">{t("hub.opportunities.next30Days")}</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant={savedOnly ? "default" : "outline"}
          className="min-h-11 gap-2"
          aria-pressed={savedOnly}
          onClick={() => setSavedOnly((value) => !value)}
        >
          <Bookmark aria-hidden="true" className="size-4" />
          {t("hub.opportunities.saved")}
        </Button>
      </div>
      {opportunities.isLoading ? <Loading label={t("hub.opportunities.loading")} /> : null}
      {opportunities.error ? (
        <Failure error={opportunities.error} onRetry={() => void opportunities.refetch()} />
      ) : null}
      {visible.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {visible.map((item) => (
            <OpportunityCard
              key={item.id}
              item={item}
              onBookmark={() => bookmark.mutate({ id: item.id, saved: !item.bookmarked })}
            />
          ))}
        </div>
      ) : opportunities.isSuccess ? (
        <Empty title={t("hub.opportunities.emptyTitle")} text={t("hub.opportunities.emptyText")} />
      ) : null}
      {submissions.data?.length ? (
        <section>
          <h3 className="text-lg font-bold">{t("hub.opportunities.yourSubmissions")}</h3>
          <div className="mt-3 divide-y rounded-lg border">
            {submissions.data.map((item) => (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDate(item.created_at, "en")}
                  </p>
                </div>
                <Badge
                  variant={
                    item.status === "rejected"
                      ? "destructive"
                      : item.status === "published"
                        ? "default"
                        : "secondary"
                  }
                >
                  {t(`hub.status.${item.status}` as TranslationKey)}
                </Badge>
                {item.review_note ? (
                  <p className="w-full text-sm text-muted-foreground">{item.review_note}</p>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}
      <OpportunityDialog
        open={submitOpen}
        onOpenChange={setSubmitOpen}
        onSubmitted={async () => {
          setSubmitOpen(false);
          await client.invalidateQueries({ queryKey: ["opportunity-submissions"] });
        }}
      />
    </div>
  );
}

function OpportunityCard({ item, onBookmark }: { item: Opportunity; onBookmark: () => void }) {
  const t = useT();
  const { language } = useLanguage();
  const days = Math.max(
    0,
    Math.ceil((new Date(item.deadline_at).getTime() - Date.now()) / 86400000),
  );
  return (
    <article className="flex min-h-64 flex-col rounded-lg border bg-card p-5 shadow-sm transition-colors hover:border-primary/40">
      <div className="flex items-start justify-between gap-3">
        <Badge variant="secondary">
          {t(`hub.opportunityType.${item.opportunity_type}` as TranslationKey)}
        </Badge>
        <Button
          variant="ghost"
          size="icon"
          className="-mr-2 -mt-2 size-11"
          aria-label={item.bookmarked ? t("hub.opportunities.unsave") : t("hub.opportunities.save")}
          aria-pressed={item.bookmarked}
          onClick={onBookmark}
        >
          <Bookmark
            aria-hidden="true"
            className={cn("size-5", item.bookmarked && "fill-current text-primary")}
          />
        </Button>
      </div>
      <h3 className="mt-4 text-lg font-bold leading-6">{item.title}</h3>
      <p className="mt-1 text-sm font-medium text-muted-foreground">{item.organization}</p>
      <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">
        {item.description}
      </p>
      <div className="mt-auto grid gap-2 border-t pt-4 text-xs text-muted-foreground sm:grid-cols-2">
        <span className="flex items-center gap-2">
          <Clock3 aria-hidden="true" className="size-4 text-primary" />
          {days <= 1
            ? t("hub.opportunities.dueSoon")
            : t("hub.opportunities.daysLeft", { count: days })}
        </span>
        <span className="flex items-center gap-2">
          <CalendarDays aria-hidden="true" className="size-4 text-primary" />
          {formatDate(item.deadline_at, language)}
        </span>
        {item.location ? (
          <span className="flex items-center gap-2">
            <MapPin aria-hidden="true" className="size-4 text-primary" />
            {item.location}
          </span>
        ) : null}
      </div>
      {item.external_url ? (
        <Button asChild className="mt-4 w-full gap-2">
          <a href={item.external_url} target="_blank" rel="noreferrer">
            {t("hub.opportunities.open")}
            <ArrowRight aria-hidden="true" className="size-4" />
          </a>
        </Button>
      ) : null}
    </article>
  );
}

function OpportunityDialog({
  open,
  onOpenChange,
  onSubmitted,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitted: () => void;
}) {
  const { user } = useAuth();
  const t = useT();
  const [form, setForm] = useState({
    title: "",
    organization: "",
    opportunity_type: "scholarship" as OpportunityType,
    description: "",
    eligibility: "",
    location: "",
    external_url: "",
    deadline_at: "",
  });
  const submit = useMutation({
    mutationFn: () =>
      submitOpportunity({
        ...form,
        eligibility: form.eligibility || null,
        location: form.location || null,
        external_url: form.external_url || null,
        deadline_at: new Date(form.deadline_at).toISOString(),
        starts_at: null,
        university_id: null,
        created_by: user!.id,
      }),
    onSuccess: () => {
      toast.success(t("hub.opportunities.submitted"));
      setForm({
        title: "",
        organization: "",
        opportunity_type: "scholarship",
        description: "",
        eligibility: "",
        location: "",
        external_url: "",
        deadline_at: "",
      });
      onSubmitted();
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const ready =
    form.title.trim().length >= 5 &&
    form.organization.trim().length >= 2 &&
    form.description.trim().length >= 30 &&
    Boolean(form.deadline_at);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("hub.opportunities.dialogTitle")}</DialogTitle>
          <DialogDescription>{t("hub.opportunities.dialogText")}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("hub.opportunities.fieldTitle")} htmlFor="opp-title">
            <Input
              id="opp-title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </Field>
          <Field label={t("hub.opportunities.organization")} htmlFor="opp-org">
            <Input
              id="opp-org"
              value={form.organization}
              onChange={(e) => setForm({ ...form, organization: e.target.value })}
            />
          </Field>
          <Field label={t("hub.opportunities.category")} htmlFor="opp-type">
            <Select
              value={form.opportunity_type}
              onValueChange={(value) =>
                setForm({ ...form, opportunity_type: value as OpportunityType })
              }
            >
              <SelectTrigger id="opp-type" className="min-h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {opportunityTypes.map((value) => (
                  <SelectItem key={value} value={value}>
                    {t(`hub.opportunityType.${value}` as TranslationKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label={t("hub.opportunities.deadline")} htmlFor="opp-deadline">
            <Input
              id="opp-deadline"
              type="date"
              min={new Date().toISOString().slice(0, 10)}
              value={form.deadline_at}
              onChange={(e) => setForm({ ...form, deadline_at: e.target.value })}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label={t("hub.opportunities.description")} htmlFor="opp-description">
              <Textarea
                id="opp-description"
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </Field>
          </div>
          <Field label={t("hub.opportunities.eligibility")} htmlFor="opp-eligibility">
            <Input
              id="opp-eligibility"
              value={form.eligibility}
              onChange={(e) => setForm({ ...form, eligibility: e.target.value })}
            />
          </Field>
          <Field label={t("hub.opportunities.location")} htmlFor="opp-location">
            <Input
              id="opp-location"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label={t("hub.opportunities.link")} htmlFor="opp-link">
              <Input
                id="opp-link"
                type="url"
                placeholder="https://"
                value={form.external_url}
                onChange={(e) => setForm({ ...form, external_url: e.target.value })}
              />
            </Field>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button disabled={!ready || submit.isPending} onClick={() => submit.mutate()}>
            {submit.isPending ? t("common.saving") : t("hub.opportunities.sendReview")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StudyBuddy() {
  const { user } = useAuth();
  const t = useT();
  const client = useQueryClient();
  const navigate = useNavigate();
  const member = useQuery({
    queryKey: ["member-profile", user!.id],
    queryFn: () => getMemberProfile(user!.id),
    retry: false,
  });
  const profile = useQuery({
    queryKey: ["buddy-profile", user!.id],
    queryFn: () => getBuddyProfile(user!.id),
    enabled: member.data?.student?.verification_status === "verified",
    retry: false,
  });
  const matches = useQuery({
    queryKey: ["buddy-matches", user!.id],
    queryFn: () => listBuddyMatches(user!.id),
    enabled: Boolean(profile.data?.is_active),
    retry: false,
  });
  const requests = useQuery({
    queryKey: ["buddy-requests", user!.id],
    queryFn: () => listBuddyRequests(user!.id),
    enabled: member.data?.student?.verification_status === "verified",
    retry: false,
  });
  const [editing, setEditing] = useState(false);
  const [requestTarget, setRequestTarget] = useState<BuddyMatch | null>(null);
  const [message, setMessage] = useState("");
  const refresh = async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: ["buddy-matches"] }),
      client.invalidateQueries({ queryKey: ["buddy-requests"] }),
    ]);
  };
  const request = useMutation({
    mutationFn: () => sendBuddyRequest(user!.id, requestTarget!.user_id, message),
    onSuccess: async () => {
      toast.success(t("hub.buddy.requestSent"));
      setRequestTarget(null);
      setMessage("");
      await refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const respond = useMutation({
    mutationFn: ({
      item,
      action,
    }: {
      item: BuddyRequest;
      action: "accepted" | "declined" | "cancelled" | "blocked";
    }) => respondToBuddyRequest(item, action),
    onSuccess: async (conversationId) => {
      await refresh();
      if (conversationId)
        void navigate({ to: "/messages", search: { conversation: conversationId } });
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const dismiss = useMutation({
    mutationFn: (otherId: string) => dismissBuddy(user!.id, otherId),
    onSuccess: refresh,
  });
  if (member.isLoading) return <Loading label={t("hub.buddy.checking")} />;
  if (member.error)
    return (
      <div className="space-y-6">
        <SectionHeading
          icon={UsersRound}
          eyebrow={t("hub.buddy.eyebrow")}
          title={t("hub.buddy.title")}
          text={t("hub.buddy.text")}
        />
        <Failure error={member.error} onRetry={() => void member.refetch()} />
      </div>
    );
  if (member.data?.student?.verification_status !== "verified")
    return (
      <div className="space-y-6">
        <SectionHeading
          icon={UsersRound}
          eyebrow={t("hub.buddy.eyebrow")}
          title={t("hub.buddy.title")}
          text={t("hub.buddy.text")}
        />
        <Empty
          title={t("hub.buddy.lockedTitle")}
          text={t("hub.buddy.lockedText")}
          action={
            <Button asChild>
              <Link to="/profile">{t("hub.buddy.openProfile")}</Link>
            </Button>
          }
        />
      </div>
    );
  return (
    <div className="space-y-8">
      <SectionHeading
        icon={UsersRound}
        eyebrow={t("hub.buddy.eyebrow")}
        title={t("hub.buddy.title")}
        text={t("hub.buddy.text")}
        action={
          profile.data ? (
            <Button variant="outline" className="min-h-11 gap-2" onClick={() => setEditing(true)}>
              <SlidersHorizontal aria-hidden="true" className="size-4" />
              {t("hub.buddy.edit")}
            </Button>
          ) : undefined
        }
      />
      {profile.isLoading ? <Loading label={t("hub.buddy.loadingProfile")} /> : null}
      {profile.error ? (
        <Failure error={profile.error} onRetry={() => void profile.refetch()} />
      ) : null}
      {profile.isSuccess && (!profile.data || editing) ? (
        <BuddyProfileForm
          initial={profile.data}
          onSaved={async () => {
            setEditing(false);
            await client.invalidateQueries({ queryKey: ["buddy-profile", user!.id] });
          }}
        />
      ) : null}
      {profile.data ? (
        requests.error ? (
          <Failure error={requests.error} onRetry={() => void requests.refetch()} />
        ) : (
          <BuddyRequests
            items={requests.data ?? []}
            userId={user!.id}
            onRespond={(item, action) => respond.mutate({ item, action })}
            busy={respond.isPending}
          />
        )
      ) : null}
      {profile.data?.is_active ? (
        <section>
          <div className="flex items-end justify-between">
            <div>
              <h3 className="text-xl font-bold">{t("hub.buddy.matches")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t("hub.buddy.matchesText")}</p>
            </div>
          </div>
          {matches.isLoading ? <Loading label={t("hub.buddy.finding")} /> : null}
          {matches.error ? (
            <Failure error={matches.error} onRetry={() => void matches.refetch()} />
          ) : null}
          {matches.data?.length ? (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {matches.data.map((match) => (
                <BuddyCard
                  key={match.user_id}
                  match={match}
                  onConnect={() => setRequestTarget(match)}
                  onDismiss={() => dismiss.mutate(match.user_id)}
                />
              ))}
            </div>
          ) : matches.isSuccess ? (
            <div className="mt-4">
              <Empty title={t("hub.buddy.emptyTitle")} text={t("hub.buddy.emptyText")} />
            </div>
          ) : null}
        </section>
      ) : null}
      <Dialog
        open={Boolean(requestTarget)}
        onOpenChange={(open) => !open && setRequestTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("hub.buddy.requestTitle", { name: requestTarget?.profile.full_name ?? "" })}
            </DialogTitle>
            <DialogDescription>{t("hub.buddy.requestText")}</DialogDescription>
          </DialogHeader>
          <Field label={t("hub.buddy.message")} htmlFor="buddy-message">
            <Textarea
              id="buddy-message"
              maxLength={300}
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t("hub.buddy.messagePlaceholder")}
            />
          </Field>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRequestTarget(null)}>
              {t("common.cancel")}
            </Button>
            <Button className="gap-2" disabled={request.isPending} onClick={() => request.mutate()}>
              <Send aria-hidden="true" className="size-4" />
              {t("hub.buddy.sendRequest")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ChipPicker({
  label,
  options,
  values,
  onChange,
  translate = false,
}: {
  label: string;
  options: string[];
  values: string[];
  onChange: (values: string[]) => void;
  translate?: boolean;
}) {
  const t = useT();
  return (
    <fieldset>
      <legend className="text-sm font-medium">{label}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = values.includes(option);
          return (
            <button
              key={option}
              type="button"
              aria-pressed={selected}
              onClick={() =>
                onChange(selected ? values.filter((item) => item !== option) : [...values, option])
              }
              className={cn(
                "min-h-11 rounded-full border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                selected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "bg-background hover:bg-muted",
              )}
            >
              {selected ? <Check aria-hidden="true" className="mr-1.5 inline size-4" /> : null}
              {translate
                ? t(`hub.availability.${option}` as TranslationKey)
                : option.replace("_", " ")}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function BuddyProfileForm({
  initial,
  onSaved,
}: {
  initial: BuddyProfileInput | null | undefined;
  onSaved: () => void;
}) {
  const { user } = useAuth();
  const t = useT();
  const [topicsText, setTopicsText] = useState(initial?.topics.join(", ") ?? "");
  const [goals, setGoals] = useState(initial?.goals ?? "");
  const [modes, setModes] = useState<BuddyProfileInput["study_modes"]>(
    initial?.study_modes ?? ["online"],
  );
  const [languages, setLanguages] = useState(initial?.languages ?? ["Myanmar"]);
  const [availability, setAvailability] = useState(initial?.availability ?? []);
  const [active, setActive] = useState(initial?.is_active ?? true);
  const topics = topicsText
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);
  const save = useMutation({
    mutationFn: () =>
      saveBuddyProfile(user!.id, {
        topics,
        goals: goals.trim(),
        study_modes: modes,
        languages,
        availability,
        is_active: active,
      }),
    onSuccess: () => {
      toast.success(t("hub.buddy.profileSaved"));
      onSaved();
    },
    onError: (error: Error) => toast.error(error.message),
  });
  return (
    <section className="rounded-lg border bg-muted/20 p-4 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
          <UserRoundSearch aria-hidden="true" className="size-5" />
        </div>
        <div>
          <h3 className="font-bold">
            {initial ? t("hub.buddy.editTitle") : t("hub.buddy.setupTitle")}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">{t("hub.buddy.setupText")}</p>
        </div>
      </div>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field label={t("hub.buddy.topics")} htmlFor="buddy-topics">
            <Input
              id="buddy-topics"
              value={topicsText}
              onChange={(e) => setTopicsText(e.target.value)}
              placeholder={t("hub.buddy.topicsPlaceholder")}
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              {t("hub.buddy.topicsHint", { count: topics.length })}
            </p>
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label={t("hub.buddy.goals")} htmlFor="buddy-goals">
            <Textarea
              id="buddy-goals"
              maxLength={500}
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              placeholder={t("hub.buddy.goalsPlaceholder")}
            />
          </Field>
        </div>
        <ChipPicker
          label={t("hub.buddy.studyMode")}
          options={["online", "in_person"]}
          values={modes}
          onChange={(values) => setModes(values as BuddyProfileInput["study_modes"])}
        />
        <ChipPicker
          label={t("hub.buddy.languages")}
          options={languageOptions}
          values={languages}
          onChange={setLanguages}
        />
        <div className="sm:col-span-2">
          <ChipPicker
            label={t("hub.buddy.availability")}
            options={availabilityOptions}
            values={availability}
            onChange={setAvailability}
            translate
          />
        </div>
      </div>
      <label className="mt-5 flex min-h-12 cursor-pointer items-center justify-between gap-4 rounded-lg border bg-background px-4">
        <span>
          <span className="block text-sm font-medium">{t("hub.buddy.visible")}</span>
          <span className="block text-xs text-muted-foreground">{t("hub.buddy.visibleText")}</span>
        </span>
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
          className="size-5 accent-primary"
        />
      </label>
      <div className="mt-5 flex justify-end">
        <Button
          disabled={!topics.length || !modes.length || save.isPending}
          onClick={() => save.mutate()}
        >
          {save.isPending ? t("common.saving") : t("hub.buddy.saveProfile")}
        </Button>
      </div>
    </section>
  );
}

function BuddyRequests({
  items,
  userId,
  onRespond,
  busy,
}: {
  items: BuddyRequest[];
  userId: string;
  onRespond: (
    item: BuddyRequest,
    action: "accepted" | "declined" | "cancelled" | "blocked",
  ) => void;
  busy: boolean;
}) {
  const t = useT();
  const pending = items.filter((item) => item.status === "pending");
  if (!pending.length) return null;
  return (
    <section>
      <h3 className="text-lg font-bold">{t("hub.buddy.requests")}</h3>
      <div className="mt-3 divide-y rounded-lg border">
        {pending.map((item) => {
          const incoming = item.receiver_id === userId;
          const person = incoming ? item.sender : item.receiver;
          return (
            <div key={item.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
              <UserAvatar profile={person} className="size-11" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{person.full_name}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {item.message || t("hub.buddy.defaultRequest")}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {incoming ? (
                  <>
                    <Button
                      size="sm"
                      className="min-h-11 gap-1.5"
                      disabled={busy}
                      onClick={() => onRespond(item, "accepted")}
                    >
                      <Check aria-hidden="true" className="size-4" />
                      {t("hub.buddy.accept")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="min-h-11"
                      disabled={busy}
                      onClick={() => onRespond(item, "declined")}
                    >
                      {t("hub.buddy.decline")}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="min-h-11 text-destructive hover:text-destructive"
                      disabled={busy}
                      onClick={() => onRespond(item, "blocked")}
                    >
                      {t("hub.buddy.block")}
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="min-h-11"
                    disabled={busy}
                    onClick={() => onRespond(item, "cancelled")}
                  >
                    {t("hub.buddy.cancelRequest")}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function BuddyCard({
  match,
  onConnect,
  onDismiss,
}: {
  match: BuddyMatch;
  onConnect: () => void;
  onDismiss: () => void;
}) {
  const t = useT();
  const student = buddyStudent(match.profile);
  return (
    <article className="rounded-lg border bg-card p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <UserAvatar profile={match.profile} className="size-12" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-bold">{match.profile.full_name}</h4>
            <Badge>
              {match.score}% {t("hub.matcher.match")}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {student?.department?.name ?? t("field.department")} · {student?.university?.name}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="-mr-2 -mt-2 size-11"
          aria-label={t("hub.buddy.dismiss")}
          onClick={onDismiss}
        >
          <X aria-hidden="true" className="size-4" />
        </Button>
      </div>
      {match.goals ? (
        <p className="mt-4 line-clamp-3 text-sm leading-6 text-muted-foreground">{match.goals}</p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-1.5">
        {match.topics.slice(0, 4).map((topic) => (
          <Badge key={topic} variant="secondary">
            {topic}
          </Badge>
        ))}
      </div>
      <div className="mt-4 space-y-2 border-t pt-4 text-xs text-muted-foreground">
        {match.reasons.map((reason) => (
          <p key={reason} className="flex items-center gap-2">
            <CheckCircle2 aria-hidden="true" className="size-4 text-primary" />
            {reason}
          </p>
        ))}
      </div>
      <Button className="mt-4 w-full gap-2" onClick={onConnect}>
        <MessageCircle aria-hidden="true" className="size-4" />
        {t("hub.buddy.connect")}
      </Button>
    </article>
  );
}
