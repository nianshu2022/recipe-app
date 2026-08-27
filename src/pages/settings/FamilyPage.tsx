import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Users, Copy, RefreshCw, LogOut, Trash2, Check } from 'lucide-react'
import { useFamilyStore } from '@/stores/familyStore'

export function FamilyPage() {
  const navigate = useNavigate()
  const {
    group,
    createGroup,
    joinGroup,
    regenerateCode,
    removeMember,
    leaveGroup,
    getInviteCode,
    isOwner,
  } = useFamilyStore()

  const [showJoin, setShowJoin] = useState(false)
  const [inviteCode, setInviteCode] = useState('')
  const [nickname, setNickname] = useState('')
  const [email, setEmail] = useState('')
  const [copied, setCopied] = useState(false)

  const handleCreate = () => {
    createGroup(nickname || '我', email || 'local')
    setNickname('')
    setEmail('')
  }

  const handleJoin = () => {
    if (!inviteCode.trim()) return
    const ok = joinGroup(inviteCode.toUpperCase(), nickname || '家人', email)
    if (ok) {
      setShowJoin(false)
      setInviteCode('')
      setNickname('')
      setEmail('')
    }
  }

  const handleCopyCode = async () => {
    const code = getInviteCode()
    if (code) {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!group) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="ios-blur-header sticky top-0 z-40 -mx-5 -mt-6 flex items-center gap-3 px-5 py-3">
          <button
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-[var(--color-text-muted)] hover:bg-[var(--color-bg-subtle)]"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-semibold text-[var(--color-text)]">家庭协作</h1>
        </div>

        {/* No group */}
        <div className="rounded-2xl bg-[var(--color-bg-card)] p-6 text-center">
          <Users size={48} className="mx-auto mb-4 text-[var(--color-text-muted)]" />
          <h2 className="mb-2 text-lg font-semibold text-[var(--color-text)]">创建或加入家庭</h2>
          <p className="mb-6 text-sm text-[var(--color-text-muted)]">
            与家人共享菜谱和餐计划
          </p>

          <div className="space-y-3">
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="你的昵称"
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-stone-400)]"
            />
            <button
              onClick={handleCreate}
              className="w-full rounded-xl bg-[var(--color-primary)] py-3 text-sm font-medium text-white shadow-md transition-all active:scale-[0.98]"
            >
              创建家庭
            </button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--color-border)]" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-[var(--color-bg-card)] px-2 text-[var(--color-text-muted)]">或</span>
              </div>
            </div>
            <button
              onClick={() => setShowJoin(true)}
              className="w-full rounded-xl border border-[var(--color-border)] py-3 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-bg-subtle)]"
            >
              加入家庭
            </button>
          </div>
        </div>

        {/* Join dialog */}
        {showJoin && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowJoin(false)}>
            <div
              className="mx-4 w-full max-w-sm rounded-2xl bg-[var(--color-bg-card)] p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="mb-4 text-lg font-semibold text-[var(--color-text)]">加入家庭</h3>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="输入邀请码（6位）"
                maxLength={6}
                className="mb-3 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-center text-lg font-mono tracking-widest text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-stone-400)]"
                autoFocus
              />
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="你的昵称"
                className="mb-4 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-stone-400)]"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowJoin(false)}
                  className="flex-1 rounded-xl border border-[var(--color-border)] py-2.5 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-subtle)]"
                >
                  取消
                </button>
                <button
                  onClick={handleJoin}
                  disabled={!inviteCode.trim()}
                  className="flex-1 rounded-xl bg-[var(--color-primary)] py-2.5 text-sm font-medium text-white shadow-md transition-all active:scale-[0.98] disabled:opacity-40"
                >
                  加入
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="ios-blur-header sticky top-0 z-40 -mx-5 -mt-6 flex items-center gap-3 px-5 py-3">
        <button
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-[var(--color-text-muted)] hover:bg-[var(--color-bg-subtle)]"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-semibold text-[var(--color-text)]">家庭协作</h1>
      </div>

      {/* Invite code */}
      <div className="rounded-2xl bg-[var(--color-bg-card)] p-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm text-[var(--color-text-muted)]">邀请码</span>
          {isOwner() && (
            <button
              onClick={regenerateCode}
              className="flex items-center gap-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            >
              <RefreshCw size={12} />
              重新生成
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 rounded-xl bg-[var(--color-bg)] p-4 text-center font-mono text-2xl tracking-[0.3em] text-[var(--color-text)]">
            {getInviteCode()}
          </div>
          <button
            onClick={handleCopyCode}
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-bg)] text-[var(--color-text-muted)] transition-colors hover:bg-emerald-50 hover:text-emerald-600"
          >
            {copied ? <Check size={20} /> : <Copy size={20} />}
          </button>
        </div>
        <p className="mt-3 text-xs text-[var(--color-text-muted)]">
          分享此邀请码给家人，让他们加入你的家庭
        </p>
      </div>

      {/* Members */}
      <div className="rounded-2xl bg-[var(--color-bg-card)] p-5">
        <h3 className="mb-3 text-sm font-medium text-[var(--color-text-muted)]">
          家庭成员（{group.members.length}）
        </h3>
        <div className="space-y-2">
          {group.members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between rounded-xl p-3 hover:bg-[var(--color-bg-subtle)]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-bg-subtle)] text-sm font-medium text-[var(--color-text)]">
                  {member.nickname.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--color-text)]">{member.nickname}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {member.userId === 'local' ? '我' : member.email}
                  </p>
                </div>
              </div>
              {member.userId !== 'local' && isOwner() && (
                <button
                  onClick={() => removeMember(member.id)}
                  className="rounded-lg p-2 text-[var(--color-text-muted)] hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Leave */}
      <button
        onClick={leaveGroup}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--color-bg-card)] py-3.5 text-sm font-medium text-red-500 shadow-xs transition-colors hover:bg-red-50 dark:hover:bg-red-950/20"
      >
        <LogOut size={16} />
        退出家庭
      </button>
    </div>
  )
}
