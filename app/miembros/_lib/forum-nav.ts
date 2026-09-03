"use client"

// Navegación dirigida al foro: un portal pide "llévame al tema X" y el
// ForumFeed, al montar, hace scroll + resalta ese post (match por título).

let pendingTitle: string | null = null

export const FORUM_GOTO_EVENT = "app:forum-goto"

export function setForumTarget(title: string | null | undefined) {
  pendingTitle = title || null
  if (pendingTitle && typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(FORUM_GOTO_EVENT, { detail: { title: pendingTitle } }))
  }
}

export function consumeForumTarget(): string | null {
  const t = pendingTitle
  pendingTitle = null
  return t
}
