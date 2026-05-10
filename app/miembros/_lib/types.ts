// Tipos compartilhados do domínio da área de membros.
// Espelham o que vem das APIs /api/forum/*, /api/feed-posts, etc.

export type ForumAuthor = {
  user_id: string
  author_name: string
  author_username?: string | null
  author_avatar: string // iniciais
  author_avatar_url?: string | null
  author_badge_id?: string | null
  author_star_id?: string | null
  author_flame_id?: string | null
  author_avatar_border?: string | null
  author_is_admin?: boolean
}

export type ForumPost = ForumAuthor & {
  id: string
  title: string
  body: string
  image_url?: string | null
  tags?: string[]
  likes_count: number
  dislikes_count?: number
  replies_count: number
  hot?: boolean
  created_at: string
  edited_at?: string | null
  pinned?: boolean
  pin_order?: number | null
  liked_by_me?: boolean
  disliked_by_me?: boolean
}

export type ForumReply = ForumAuthor & {
  id: string
  body: string
  created_at: string
  edited_at?: string | null
  likes_count?: number
  dislikes_count?: number
  liked_by_me?: boolean
  disliked_by_me?: boolean
}

export type FeedPost = {
  id: string
  author_name: string
  author_avatar: string
  title: string
  body: string
  type_key: string // content | challenge | tip | bonus
  type_emoji: string
  type_label: string
  reactions: Array<[string, number]>
  pinned: boolean
  created_at: string
  edited_at?: string | null
}

export type LeaderboardStats = {
  forum_post?: number
  forum_reply?: number
  episode_comment?: number
  forum_like_received?: number
  funnel_created?: number
  insignia_total?: number
  login_day?: number
}

export type FeaturedBadge = {
  id: string
  name: string
  tier?: string
}

export type LeaderboardUser = {
  id: string
  full_name: string
  username?: string | null
  avatar_url?: string | null
  level: number
  total_xp: number
  rank_label?: string | null
  featured_badge?: FeaturedBadge | null
  stats?: LeaderboardStats
}

export type XpMe = {
  level: number
  total_xp: number
  percent?: number          // 0-100 progresso dentro do level atual
  xp_in_level?: number      // XP ganhada DENTRO do level atual
  xp_for_level?: number     // XP necessária pra completar o level atual
  rank_label?: string | null
  next_level_xp?: number
  current_level_xp?: number
}

export type Funnel = {
  id: string
  user_id: string
  author_name: string
  author_username?: string | null
  author_avatar?: string
  author_avatar_url?: string | null
  author_badge_id?: string | null
  author_star_id?: string | null
  author_flame_id?: string | null
  author_avatar_border?: string | null
  author_is_admin?: boolean
  name: string
  niche: string
  url: string
  image_url: string
  approved?: boolean
  likes_count?: number
  dislikes_count?: number
  feedbacks_count?: number
  viewer_vote?: "like" | "dislike" | null
  created_at: string
}

export type FunnelFeedback = ForumAuthor & {
  id: string
  funnel_id: string
  body: string
  parent_feedback_id?: string | null
  created_at: string
  edited_at?: string | null
}

export type EpisodeComment = ForumAuthor & {
  id: string
  text: string
  parent_comment_id?: string | null
  likes_count?: number
  dislikes_count?: number
  my_vote?: "like" | "dislike" | null
  created_at: string
  edited_at?: string | null
}

export type NotificationItem = {
  id: string
  type: string
  title: string
  preview?: string | null
  source_user_id?: string | null
  source_user_name?: string | null
  source_user_avatar_url?: string | null
  created_at: string
  read_at?: string | null
}
