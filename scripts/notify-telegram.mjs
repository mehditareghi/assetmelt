import { execSync } from 'node:child_process'

const SITE_URL = process.env.SITE_URL ?? 'https://assetmelt.com'
const REPO = process.env.GITHUB_REPOSITORY ?? 'mehditareghi/assetmelt'

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

const SECTION_EMOJI = {
  'features': '✨',
  'bug fixes': '🐛',
  'performance improvements': '⚡',
  'reverts': '⏪',
  'documentation': '📝',
  'breaking changes': '💥',
}

/**
 * Converts semantic-release Markdown changelog to Telegram HTML.
 *
 * Input example:
 *   ## [1.2.0](...) (2024-01-15)
 *   ### Features
 *   * **scope:** do a thing ([abc1234](url))
 *   ### Bug Fixes
 *   * fix something ([def5678](url))
 */
function markdownToTelegramHtml(markdown) {
  const lines = markdown.split('\n')
  const out = []

  for (const raw of lines) {
    const line = raw.trimEnd()

    // Skip the top-level ## version heading — we already show version in the title
    if (/^##\s+\[/.test(line) || /^##\s+\d+\.\d+/.test(line)) continue

    // ### Section headings
    const sectionMatch = line.match(/^###\s+(.+)/)
    if (sectionMatch) {
      const title = sectionMatch[1].trim()
      const emoji = SECTION_EMOJI[title.toLowerCase()] ?? '•'
      if (out.length > 0) out.push('')
      out.push(`<b>${emoji} ${escapeHtml(title)}</b>`)
      continue
    }

    // Bullet items: * or -
    const bulletMatch = line.match(/^[*-]\s+(.+)/)
    if (bulletMatch) {
      let item = bulletMatch[1]

      // Remove **scope:** bold markers, keep the text
      item = item.replace(/\*\*([^*]+)\*\*/g, '$1')

      // Extract commit SHAs before escaping: ([abc1234](url)) → placeholder
      const shas = []
      item = item.replace(/\(\[([0-9a-f]{7,})\]\([^)]+\)\)/g, (_, sha) => {
        shas.push(sha)
        return `\x00SHA${shas.length - 1}\x00`
      })

      // Strip any remaining markdown links [text](url) → text
      item = item.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')

      // Escape HTML, then restore SHAs as <code>
      item = escapeHtml(item)
      item = item.replace(/\x00SHA(\d+)\x00/g, (_, i) => `<code>${shas[i]}</code>`)

      out.push(`  • ${item}`)
      continue
    }

    // Skip blank lines inside sections but preserve spacing between sections
    if (line === '') {
      if (out.length > 0 && out[out.length - 1] !== '') out.push('')
      continue
    }
  }

  // Collapse multiple consecutive blank lines into one
  return out
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function truncate(text, max = 2800) {
  if (text.length <= max) return text
  return `${text.slice(0, max - 24)}\n\n… (truncated)`
}

function runGit(command) {
  try {
    return execSync(command, { encoding: 'utf8' }).trim()
  } catch {
    return ''
  }
}

function getContributors(fromTag, toRef) {
  const range =
    fromTag && fromTag !== 'none' ? `${fromTag}..${toRef}` : toRef || 'HEAD'
  const names = runGit(`git log ${range} --format=%aN`)
  if (!names) return []
  return [...new Set(names.split('\n').filter(Boolean))].sort((a, b) =>
    a.localeCompare(b),
  )
}

function getRecentCommits(fromTag, limit = 5) {
  const range =
    fromTag && fromTag !== 'none' ? `${fromTag}..HEAD` : 'HEAD'
  const log = runGit(
    `git log ${range} --pretty=format:%s -n ${limit} 2>/dev/null`,
  )
  if (!log) return []
  return log.split('\n').filter(Boolean)
}

function link(href, label) {
  return `<a href="${escapeHtml(href)}">${escapeHtml(label)}</a>`
}

function buildMessage({
  status,
  version,
  tag,
  previousTag,
  releaseNotes,
  releaseUrl,
  deployUrl,
  workflowUrl,
  commitSha,
  commitMessage,
  contributors,
  recentCommits,
}) {
  if (status === 'release_failed') {
    return truncate(
      [
        `<b>❌ Asset Melt — release failed</b>`,
        '',
        `The semantic-release job did not complete. No tag was created.`,
        '',
        link(workflowUrl, 'View workflow run'),
      ].join('\n'),
    )
  }

  if (status === 'deploy_failed') {
    return truncate(
      [
        `<b>⚠️ Asset Melt v${escapeHtml(version)} — deploy failed</b>`,
        '',
        `Tag <code>${escapeHtml(tag)}</code> was created but the Vercel deploy job failed.`,
        '',
        [
          releaseUrl ? link(releaseUrl, 'GitHub Release') : null,
          link(workflowUrl, 'View workflow run'),
        ].filter(Boolean).join(' · '),
      ].join('\n'),
    )
  }

  if (status === 'released') {
    const contributorBlock =
      contributors.length > 0
        ? `\n<b>Contributors</b>\n${contributors.map((name) => `• ${escapeHtml(name)}`).join('\n')}`
        : ''

    const notesBlock = releaseNotes
      ? `\n${markdownToTelegramHtml(releaseNotes)}`
      : ''

    const links = [
      releaseUrl ? link(releaseUrl, 'GitHub Release') : null,
      link(deployUrl || SITE_URL, 'Live site'),
      link(workflowUrl, 'Workflow'),
    ]
      .filter(Boolean)
      .join(' · ')

    return truncate(
      [
        `<b>🚀 Asset Melt v${escapeHtml(version)} is live</b>`,
        notesBlock,
        contributorBlock,
        '',
        links,
      ].join('\n'),
    )
  }

  // no_release
  const commitsBlock =
    recentCommits.length > 0
      ? `\n<b>Commits</b>\n${recentCommits.map((subject) => `• <code>${escapeHtml(subject)}</code>`).join('\n')}`
      : ''

  const since =
    previousTag && previousTag !== 'none'
      ? `since <code>${escapeHtml(previousTag)}</code>`
      : 'on this push'

  return truncate(
    [
      `<b>ℹ️ Asset Melt — no release</b>`,
      '',
      `No new version ${since}. Deploy skipped.`,
      commitsBlock,
      '',
      link(workflowUrl, 'View workflow run'),
    ].join('\n'),
  )
}

async function sendTelegram(token, chatId, text, messageThreadId) {
  const payload = {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  }

  if (messageThreadId) {
    payload.message_thread_id = Number(messageThreadId)
  }

  const response = await fetch(
    `https://api.telegram.org/bot${token}/sendMessage`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
  )

  const body = await response.json()
  if (!response.ok || !body.ok) {
    throw new Error(
      body.description ?? `Telegram API error (${response.status})`,
    )
  }

  return body
}

const token = process.env.TELEGRAM_BOT_TOKEN
const chatId = process.env.TELEGRAM_CHAT_ID
const messageThreadId = process.env.TELEGRAM_MESSAGE_THREAD_ID ?? ''

if (!token || !chatId) {
  console.log(
    'Telegram notify skipped: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set.',
  )
  process.exit(0)
}

const status = process.env.NOTIFY_STATUS ?? 'no_release'
const version = process.env.NOTIFY_VERSION ?? ''
const tag = process.env.NOTIFY_TAG ?? ''
const previousTag = process.env.NOTIFY_PREVIOUS_TAG ?? 'none'
const releaseNotes = process.env.NOTIFY_RELEASE_NOTES ?? ''
const releaseUrl =
  process.env.NOTIFY_RELEASE_URL ??
  (tag ? `https://github.com/${REPO}/releases/tag/${tag}` : '')
const deployUrl = process.env.NOTIFY_DEPLOY_URL ?? SITE_URL
const workflowUrl =
  process.env.NOTIFY_WORKFLOW_URL ??
  `https://github.com/${REPO}/actions/runs/${process.env.GITHUB_RUN_ID ?? ''}`
const commitSha = process.env.GITHUB_SHA ?? ''
const commitMessage = process.env.NOTIFY_COMMIT_MESSAGE ?? ''

const toRef = tag || 'HEAD'
const contributors =
  status === 'released' || status === 'deploy_failed'
    ? getContributors(previousTag, toRef)
    : []
const recentCommits =
  status === 'no_release' ? getRecentCommits(previousTag) : []

const message = buildMessage({
  status,
  version,
  tag,
  previousTag,
  releaseNotes,
  releaseUrl,
  deployUrl,
  workflowUrl,
  commitSha,
  commitMessage,
  contributors,
  recentCommits,
})

console.log('Sending Telegram notification…')
await sendTelegram(token, chatId, message, messageThreadId)
console.log('Telegram notification sent.')
