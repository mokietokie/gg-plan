"use client";

import { useActionState, useEffect, useState } from "react";
import { Users, UserPlus, UserCheck, UserX, Loader2, Pencil, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  sendInvitation,
  acceptInvitation,
  declineInvitation,
  removeConnection,
  updateNickname,
} from "@/app/(protected)/todos/sharing-actions";
import type { SharedUser, InvitationWithEmail } from "@/types/sharing";

export function SharingManager({
  connectedUsers,
  pendingInvitations,
  sentInvitations,
  pendingCount,
}: {
  connectedUsers: SharedUser[];
  pendingInvitations: InvitationWithEmail[];
  sentInvitations: InvitationWithEmail[];
  pendingCount: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="relative text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              aria-label="투두 공유"
            >
              <Users />
              {pendingCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {pendingCount}
                </span>
              )}
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>투두 공유</TooltipContent>
      </Tooltip>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>투두 공유 관리</DialogTitle>
          <DialogDescription>
            동료를 초대하면 서로의 투두를 볼 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <InviteSection />

          {pendingInvitations.length > 0 && (
            <>
              <Separator />
              <PendingSection invitations={pendingInvitations} />
            </>
          )}

          {sentInvitations.length > 0 && (
            <>
              <Separator />
              <SentSection invitations={sentInvitations} />
            </>
          )}

          {connectedUsers.length > 0 && (
            <>
              <Separator />
              <ConnectionsSection users={connectedUsers} />
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InviteSection() {
  const [state, formAction, isPending] = useActionState(sendInvitation, null);
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (state === null && !isPending) {
      setEmail("");
    }
  }, [state, isPending]);

  return (
    <div className="space-y-2">
      <h4 className="flex items-center gap-1.5 text-sm font-medium">
        <UserPlus className="h-4 w-4" />
        초대 보내기
      </h4>
      <form action={formAction} className="flex gap-2">
        <Input
          name="email"
          type="email"
          placeholder="동료의 이메일 주소"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="flex-1"
        />
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "초대"}
        </Button>
      </form>
      {state && "error" in state && (
        <p className="text-xs text-destructive">{state.error}</p>
      )}
    </div>
  );
}

function PendingSection({
  invitations,
}: {
  invitations: InvitationWithEmail[];
}) {
  return (
    <div className="space-y-2">
      <h4 className="flex items-center gap-1.5 text-sm font-medium">
        <UserCheck className="h-4 w-4" />
        받은 초대
      </h4>
      <div className="space-y-2">
        {invitations.map((inv) => (
          <PendingItem key={inv.id} invitation={inv} />
        ))}
      </div>
    </div>
  );
}

function PendingItem({ invitation }: { invitation: InvitationWithEmail }) {
  const [accepting, setAccepting] = useState(false);
  const [declining, setDeclining] = useState(false);

  async function handleAccept() {
    setAccepting(true);
    const fd = new FormData();
    fd.set("id", invitation.id);
    await acceptInvitation(fd);
    setAccepting(false);
  }

  async function handleDecline() {
    setDeclining(true);
    const fd = new FormData();
    fd.set("id", invitation.id);
    await declineInvitation(fd);
    setDeclining(false);
  }

  return (
    <div className="flex items-center justify-between rounded-md border px-3 py-2">
      <span className="truncate text-sm">{invitation.from_email}</span>
      <div className="flex gap-1.5 ml-2 shrink-0">
        <Button
          size="sm"
          variant="default"
          onClick={handleAccept}
          disabled={accepting || declining}
        >
          {accepting ? <Loader2 className="h-3 w-3 animate-spin" /> : "수락"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleDecline}
          disabled={accepting || declining}
        >
          {declining ? <Loader2 className="h-3 w-3 animate-spin" /> : "거절"}
        </Button>
      </div>
    </div>
  );
}

function SentSection({
  invitations,
}: {
  invitations: InvitationWithEmail[];
}) {
  return (
    <div className="space-y-2">
      <h4 className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
        보낸 초대 (대기 중)
      </h4>
      <div className="space-y-1">
        {invitations.map((inv) => (
          <div
            key={inv.id}
            className="flex items-center justify-between rounded-md border border-dashed px-3 py-2"
          >
            <span className="truncate text-sm text-muted-foreground">
              {inv.to_email}
            </span>
            <span className="text-xs text-muted-foreground shrink-0 ml-2">
              대기 중
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ConnectionsSection({ users }: { users: SharedUser[] }) {
  return (
    <div className="space-y-2">
      <h4 className="flex items-center gap-1.5 text-sm font-medium">
        <UserX className="h-4 w-4" />
        연결된 동료
      </h4>
      <div className="space-y-1">
        {users.map((u) => (
          <ConnectionItem key={u.id} user={u} />
        ))}
      </div>
    </div>
  );
}

function ConnectionItem({ user }: { user: SharedUser }) {
  const [removing, setRemoving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [nickname, setNickname] = useState(user.nickname ?? "");
  const [saving, setSaving] = useState(false);

  async function handleRemove() {
    setRemoving(true);
    const fd = new FormData();
    fd.set("targetUserId", user.id);
    await removeConnection(fd);
    setRemoving(false);
  }

  async function handleSaveNickname() {
    setSaving(true);
    const fd = new FormData();
    fd.set("targetUserId", user.id);
    fd.set("nickname", nickname);
    await updateNickname(fd);
    setSaving(false);
    setEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSaveNickname();
    } else if (e.key === "Escape") {
      setNickname(user.nickname ?? "");
      setEditing(false);
    }
  }

  return (
    <div className="rounded-md border px-3 py-2 space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 min-w-0">
          {editing ? (
            <div className="flex items-center gap-1">
              <Input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="별명 입력"
                className="h-6 text-sm w-28"
                autoFocus
              />
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={handleSaveNickname}
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Check className="h-3 w-3" />
                )}
              </Button>
            </div>
          ) : (
            <>
              <span className="truncate text-sm font-medium">
                {user.nickname ?? user.email}
              </span>
              <Button
                size="icon-sm"
                variant="ghost"
                className="h-5 w-5 shrink-0"
                onClick={() => setEditing(true)}
              >
                <Pencil className="h-3 w-3" />
              </Button>
            </>
          )}
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="text-destructive hover:text-destructive shrink-0 ml-2"
          onClick={handleRemove}
          disabled={removing}
        >
          {removing ? <Loader2 className="h-3 w-3 animate-spin" /> : "연결 해제"}
        </Button>
      </div>
      {user.nickname && !editing && (
        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
      )}
    </div>
  );
}
