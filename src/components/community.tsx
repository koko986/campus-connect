import { Link } from "@tanstack/react-router";
import { BadgeCheck, Heart, MapPin, MessageCircle, Share2, Star } from "lucide-react";
import { useState } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { authors, type Author, type Post, type University } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-semibold text-primary-soft-foreground">
      <BadgeCheck className="size-3" />
      Verified
    </span>
  );
}

export function UserAvatar({ author, className }: { author: Author; className?: string }) {
  return (
    <Avatar className={cn("size-10 border border-border", className)}>
      <AvatarFallback className="bg-primary-soft text-xs font-semibold text-primary-soft-foreground">
        {author.initials}
      </AvatarFallback>
    </Avatar>
  );
}

export function AuthorLine({ author, time }: { author: Author; time?: string }) {
  return (
    <div className="flex items-center gap-3">
      <UserAvatar author={author} />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold">{author.name}</span>
          {author.verified ? <VerifiedBadge /> : null}
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {author.role === "student"
            ? `${author.major} · ${author.year} · ${author.university}`
            : "Prospective student"}
          {time ? ` · ${time}` : ""}
        </p>
      </div>
    </div>
  );
}

export function PostCard({ post }: { post: Post }) {
  const author = authors[post.authorId];
  const [liked, setLiked] = useState(false);

  return (
    <article className="card-soft overflow-hidden p-5">
      <div className="flex items-start justify-between gap-3">
        <AuthorLine author={author} time={post.time} />
        <Badge variant="secondary" className="rounded-full font-medium">
          {post.tag}
        </Badge>
      </div>

      <p className="mt-4 text-[15px] leading-relaxed text-foreground/90">{post.text}</p>

      {post.image ? (
        <img
          src={post.image}
          alt=""
          loading="lazy"
          width={1200}
          height={720}
          className="mt-4 aspect-[5/3] w-full rounded-2xl object-cover"
        />
      ) : null}

      <div className="mt-4 flex items-center gap-1 border-t border-border pt-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLiked((v) => !v)}
          className={cn("rounded-full gap-2", liked && "text-primary")}
        >
          <Heart className={cn("size-4", liked && "fill-current")} />
          {post.likes + (liked ? 1 : 0)}
        </Button>
        <Button variant="ghost" size="sm" className="rounded-full gap-2">
          <MessageCircle className="size-4" />
          {post.comments}
        </Button>
        <Button variant="ghost" size="sm" className="ml-auto rounded-full gap-2">
          <Share2 className="size-4" />
          Share
        </Button>
      </div>
    </article>
  );
}

export function UniversityCard({ university }: { university: University }) {
  return (
    <article className="card-soft flex flex-col p-5 transition-shadow hover:shadow-[var(--shadow-lift)]">
      <div className="flex items-start gap-3">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-sm font-bold text-primary-soft-foreground">
          {university.short}
        </span>
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold">{university.name}</h3>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3" /> {university.location} · {university.type}
          </p>
        </div>
        <span className="ml-auto flex items-center gap-1 text-sm font-semibold">
          <Star className="size-4 fill-primary text-primary" />
          {university.rating}
        </span>
      </div>

      <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{university.description}</p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {university.departments.slice(0, 3).map((d) => (
          <Badge key={d} variant="secondary" className="rounded-full font-normal">
            {d}
          </Badge>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
        <p className="text-xs text-muted-foreground">
          {university.departments.length} departments · {university.posts} posts
        </p>
        <Button asChild size="sm" className="rounded-full">
          <Link to="/universities/$id" params={{ id: university.id }}>
            View
          </Link>
        </Button>
      </div>
    </article>
  );
}
