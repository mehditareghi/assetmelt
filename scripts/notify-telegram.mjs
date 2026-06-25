import { execSync } from 'node:child_process'

const SITE_URL = process.env.SITE_URL ?? 'https://assetmelt.com'
const REPO = process.env.GITHUB_REPOSITORY ?? 'mehditareghi/assetmelt'

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
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
  const shortSha = commitSha?.slice(0, 7) ?? ''
  const commitLine = commitMessage
    ? `\n<b>Latest commit</b>\n<code>${escapeHtml(commitMessage)}</code>${shortSha ? ` (${shortSha})` : ''}`
    : ''

  if (status === 'release_failed') {
    return truncate(
      `<b>❌ Asset Melt — release failed</b>\n\nThe semantic-release job did not complete.${commitLine}\n\n${link(workflowUrl, 'View workflow run')}`,
    )
  }

  if (status === 'deploy_failed') {
    return truncate(
      [
        `<b>⚠️ Asset Melt v${escapeHtml(version)} — deploy failed</b>`,
        '',
        `Tag <code>${escapeHtml(tag)}</code> was published, but the Vercel deploy job failed.`,
        releaseUrl ? `\n${link(releaseUrl, 'GitHub Release')}` : '',
        commitLine,
        '',
        link(workflowUrl, 'View workflow run'),
      ].join('\n'),
    )
  }

  if (status === 'released') {
    const contributorBlock =
      contributors.length > 0
        ? `\n<b>Contributors</b>\n${contributors.map((name) => `• ${escapeHtml(name)}`).join('\n')}`
        : ''

    const notesBlock = releaseNotes
      ? `\n<b>Release notes</b>\n<pre>${escapeHtml(releaseNotes.trim())}</pre>`
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
        `<b>🚀 Asset Melt v${escapeHtml(version)}</b>`,
        '',
        `Released and deployed to production.`,
        notesBlock,
        contributorBlock,
        commitLine,
        '',
        links,
      ].join('\n'),
    )
  }

  // no_release
  const commitsBlock =
    recentCommits.length > 0
      ? `\n<b>Recent commits</b> (not releasable)\n${recentCommits.map((subject) => `• <code>${escapeHtml(subject)}</code>`).join('\n')}`
      : ''

  const since =
    previousTag && previousTag !== 'none'
      ? `since <code>${escapeHtml(previousTag)}</code>`
      : 'on this push'

  return truncate(
    [
      `<b>ℹ️ Asset Melt — no release</b>`,
      '',
      `No new version ${since}.`,
      'Commits did not include a releasable <code>feat</code>, <code>fix</code>, or <code>perf</code>.',
      'Build and deploy were skipped.',
      commitsBlock,
      commitLine,
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
