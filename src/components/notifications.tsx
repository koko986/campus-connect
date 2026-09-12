import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  Bell,
  BriefcaseBusiness,
  CheckCheck,
  Heart,
  MessageCircle,
  MessageSquareText,
  ThumbsUp,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { UserAvatar } from "@/components/community";
import { Empty, Failure, Loading } from "@/components/states";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import type { MemberNotification } from "@/lib/data";
import { listNotifications, markAllNotificationsRead, markNotificationRead } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { useLanguage, useT, type TranslationKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const notificationMeta: Record<
  MemberNotification["notification_type"],
  { icon: typeof Bell; label: TranslationKey }
> = {
  answer: { icon: MessageSquareText, label: "notifications.type.answer" },
  comment: { icon: MessageCircle, label: "notifications.type.comment" },
  helpful_vote: { icon: ThumbsUp, label: "notifications.type.helpfulVote" },
  like: { icon: Heart, label: "notifications.type.like" },
  message: { icon: MessageCircle, label: "notifications.type.message" },
  system: { icon: Bell, label: "notifications.type.system" },
  opportunity_deadline: {
    icon: BriefcaseBusiness,
    label: "notifications.type.opportunityDeadline",
  },
  opportunity_status: { icon: BriefcaseBusiness, label: "notifications.type.opportunityStatus" },
  buddy_request: { icon: UsersRound, label: "notifications.type.buddyRequest" },
  buddy_accepted: { icon: UsersRound, label: "notifications.type.buddyAccepted" },
};

export function NotificationsPage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const t = useT();
  const navigate = useNavigate();
  const client = useQueryClient();
  const queryKey = ["notifications", user!.id] as const;
  const notifications = useQuery({
    queryKey,
    queryFn: () => listNotifications(user!.id),
  });

  const markAll = useMutation({
    mutationFn: () => markAllNotificationsRead(user!.id),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey }),
        client.invalidateQueries({ queryKey: ["notification-count", user!.id] }),
      ]);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  async function openNotification(notification: MemberNotification) {
    if (!notification.read_at) {
      await markNotificationRead(notification.id, user!.id);
      await Promise.all([
        client.invalidateQueries({ queryKey }),
        client.invalidateQueries({ queryKey: ["notification-count", user!.id] }),
      ]);
    }
    if (!notification.entity_id) {
      toast.info(t("notifications.noDestination"));
      return;
    }
    if (notification.entity_type === "question") {
      await navigate({
        to: "/questions/$id",
        params: { id: notification.entity_id },
        hash: notification.notification_type === "answer" ? "answers" : undefined,
      });
    } else if (notification.entity_type === "post") {
      await navigate({
        to: "/posts/$id",
        params: { id: notification.entity_id },
        hash: notification.notification_type === "comment" ? "comments" : undefined,
      });
    } else if (notification.entity_type === "conversation") {
      await navigate({
        to: "/messages",
        search: { conversation: notification.entity_id },
      });
    } else if (notification.entity_type === "opportunity") {
      await navigate({ to: "/hub", search: { tab: "opportunities" } });
    } else if (notification.entity_type === "buddy_request") {
      await navigate({ to: "/hub", search: { tab: "connect" } });
    } else {
      toast.info(t("notifications.noDestination"));
    }
  }

  const unread = notifications.data?.filter((item) => !item.read_at).length ?? 0;

  return (
    <AppShell title={t("notifications.title")}>
      <div className="mx-auto max-w-3xl">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">{t("notifications.note")}</p>
            <h2 className="mt-1 text-2xl font-bold">{t("notifications.heading")}</h2>
          </div>
          {unread > 0 ? (
            <Button
              variant="outline"
              size="sm"
              disabled={markAll.isPending}
              onClick={() => markAll.mutate()}
            >
              <CheckCheck className="size-4" />
              {t("notifications.markAll")}
            </Button>
          ) : null}
        </div>

        <div className="card-soft mt-6 overflow-hidden">
          {notifications.isLoading ? <Loading label={t("notifications.loading")} /> : null}
          {notifications.error ? (
            <Failure error={notifications.error} onRetry={() => void notifications.refetch()} />
          ) : null}
          {notifications.data?.map((notification) => {
            const meta = notificationMeta[notification.notification_type];
            const Icon = meta.icon;
            const actionable = Boolean(notification.entity_id);
            return (
              <button
                key={notification.id}
                type="button"
                disabled={!actionable}
                onClick={() => void openNotification(notification)}
                className={cn(
                  "flex w-full items-start gap-3 border-b border-border p-4 text-left last:border-b-0",
                  actionable && "cursor-pointer hover:bg-muted/60",
                  !notification.read_at && "bg-primary-soft/35",
                )}
              >
                {notification.actor ? (
                  <UserAvatar profile={notification.actor} className="size-10 shrink-0" />
                ) : (
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                    <Icon className="size-5" />
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    {notification.actor?.full_name ?? t("notifications.takka")}
                    {!notification.read_at ? (
                      <span
                        className="size-2 rounded-full bg-primary"
                        aria-label={t("notifications.unread")}
                      />
                    ) : null}
                  </span>
                  <span className="mt-0.5 block text-xs font-medium text-primary">
                    {t(meta.label)}
                  </span>
                  <span className="mt-1 block break-words text-sm text-muted-foreground">
                    {notification.body}
                  </span>
                  <span className="mt-2 block text-xs text-muted-foreground">
                    {formatDate(notification.created_at, language)}
                  </span>
                </span>
              </button>
            );
          })}
          {notifications.isSuccess && !notifications.data.length ? (
            <div className="p-4">
              <Empty title={t("notifications.empty.title")} text={t("notifications.empty.text")} />
            </div>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}
