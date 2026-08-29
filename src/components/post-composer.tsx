import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Failure } from "@/components/states";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import type { PostScope } from "@/lib/data";
import {
  ACCEPTED_IMAGE_TYPES,
  POST_IMAGE_MAX_BYTES,
  createPost,
  listUniversities,
  uploadPostImage,
  validateImage,
} from "@/lib/data";

export function PostComposer({
  defaultUniversityId,
}: {
  defaultUniversityId?: string | undefined;
}) {
  const { user } = useAuth();
  const client = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<PostScope>("COMMUNITY");
  const [body, setBody] = useState("");
  const [topic, setTopic] = useState("");
  const [universityId, setUniversityId] = useState(defaultUniversityId ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const universities = useQuery({
    queryKey: ["universities"],
    queryFn: listUniversities,
    enabled: open,
  });

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function reset() {
    setScope("COMMUNITY");
    setBody("");
    setTopic("");
    setUniversityId(defaultUniversityId ?? "");
    setFile(null);
    if (fileInput.current) fileInput.current.value = "";
  }

  const publish = useMutation({
    mutationFn: async () => {
      const imagePath = file ? await uploadPostImage(user!.id, file) : null;
      return createPost({
        authorId: user!.id,
        body,
        imagePath,
        scope,
        topic,
        universityId: universityId || undefined,
      });
    },
    onSuccess: async () => {
      reset();
      setOpen(false);
      toast.success(scope === "COMMUNITY" ? "Posted to the community" : "Posted to your profile");
      await Promise.all([
        client.invalidateQueries({ queryKey: ["feed"] }),
        client.invalidateQueries({ queryKey: ["profile-posts"] }),
      ]);
    },
  });

  function chooseFile(next: File | null) {
    if (!next) {
      setFile(null);
      return;
    }
    const problem = validateImage(next, POST_IMAGE_MAX_BYTES);
    if (problem) {
      toast.error(problem);
      if (fileInput.current) fileInput.current.value = "";
      return;
    }
    setFile(next);
  }

  const needsUniversity = scope === "COMMUNITY" && !universityId;
  const canPublish = Boolean(body.trim()) && !needsUniversity && !publish.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button className="h-11">
          <Plus className="size-4" />
          New post
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Share with TAKKA</DialogTitle>
          <DialogDescription>
            Write from your own experience and protect personal information.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Tabs value={scope} onValueChange={(next) => setScope(next as PostScope)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="COMMUNITY">Community</TabsTrigger>
              <TabsTrigger value="PROFILE_ONLY">Profile only</TabsTrigger>
            </TabsList>
          </Tabs>
          <p className="text-xs text-muted-foreground">
            {scope === "COMMUNITY"
              ? "Appears in Home and on the university page you tag."
              : "Appears only on your profile, never in Home or university feeds."}
          </p>

          <div>
            <Label htmlFor="post-body">Post</Label>
            <Textarea
              id="post-body"
              className="mt-1 min-h-32"
              maxLength={4000}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="What would you tell a student considering this path?"
            />
          </div>

          <div>
            <Label htmlFor="post-university">
              University {scope === "COMMUNITY" ? "(required)" : "(optional)"}
            </Label>
            <Select value={universityId} onValueChange={setUniversityId}>
              <SelectTrigger id="post-university" className="mt-1">
                <SelectValue placeholder="Choose a university" />
              </SelectTrigger>
              <SelectContent>
                {universities.data?.map((university) => (
                  <SelectItem key={university.id} value={university.id}>
                    {university.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="post-topic">Topic (optional)</Label>
            <Input
              id="post-topic"
              className="mt-1"
              maxLength={80}
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              placeholder="Housing, scholarships, campus life"
            />
          </div>

          <div>
            <input
              ref={fileInput}
              id="post-image"
              type="file"
              accept={ACCEPTED_IMAGE_TYPES.join(",")}
              className="sr-only"
              onChange={(event) => chooseFile(event.target.files?.[0] ?? null)}
            />
            {preview ? (
              <div className="relative">
                <img
                  src={preview}
                  alt="Selected attachment"
                  className="max-h-64 w-full rounded-lg object-cover"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="absolute right-2 top-2 size-9"
                  aria-label="Remove image"
                  onClick={() => chooseFile(null)}
                >
                  <X className="size-4" />
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full"
                onClick={() => fileInput.current?.click()}
              >
                <ImagePlus className="size-4" />
                Add a photo
              </Button>
            )}
            <p className="mt-1.5 text-xs text-muted-foreground">JPG, PNG or WebP up to 5 MB.</p>
          </div>

          {publish.error ? <Failure error={publish.error} /> : null}

          <Button className="h-11 w-full" disabled={!canPublish} onClick={() => publish.mutate()}>
            {publish.isPending ? "Publishing..." : "Publish"}
          </Button>
          {needsUniversity ? (
            <p className="text-xs text-muted-foreground">
              Community posts need exactly one university tag.
            </p>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
