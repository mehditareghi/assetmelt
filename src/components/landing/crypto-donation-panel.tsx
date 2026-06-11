import { useEffect, useMemo, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { toast } from 'sonner'
import {
  DONATION_ASSETS,
  getDonationNetwork,
  type DonationAsset,
} from '@/lib/crypto-donations'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

async function copyText(label: string, text: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success(`${label} copied`)
  } catch {
    toast.error('Could not copy — select the text manually')
  }
}

function AssetIcon({
  asset,
  size = 'md',
  className,
}: {
  asset: DonationAsset
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const box =
    size === 'sm' ? 'size-6' : size === 'lg' ? 'size-12' : 'size-8'
  const pad = size === 'sm' ? 'p-0.5' : size === 'lg' ? 'p-1.5' : 'p-1'

  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-md border border-border/50 bg-background/80',
        box,
        pad,
        className,
      )}
    >
      <img
        src={asset.iconSrc}
        alt={asset.name}
        width={size === 'lg' ? 36 : size === 'md' ? 24 : 18}
        height={size === 'lg' ? 36 : size === 'md' ? 24 : 18}
        className="size-full object-contain"
        draggable={false}
      />
    </span>
  )
}

function CopyableField({
  label,
  value,
  copyLabel,
}: {
  label: string
  value: string
  copyLabel: string
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await copyText(copyLabel, value)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 gap-1 px-2 font-mono text-[10px]"
          onClick={handleCopy}
        >
          {copied ? (
            <Check className="size-3 text-primary" />
          ) : (
            <Copy className="size-3" />
          )}
          Copy
        </Button>
      </div>
      <div
        className="overflow-x-auto rounded-lg border border-border/50 bg-background/60 px-3 py-2.5"
        tabIndex={0}
        role="group"
        aria-label={label}
      >
        <p className="break-all font-mono text-xs leading-relaxed text-foreground sm:text-sm">
          {value}
        </p>
      </div>
    </div>
  )
}

export function CryptoDonationPanel() {
  const [assetId, setAssetId] = useState(DONATION_ASSETS[0].id)
  const [networkId, setNetworkId] = useState(DONATION_ASSETS[0].defaultNetworkId)

  const asset = useMemo(
    () => DONATION_ASSETS.find((a) => a.id === assetId) ?? DONATION_ASSETS[0],
    [assetId],
  )

  const [copiedAll, setCopiedAll] = useState(false)

  useEffect(() => {
    const exists = asset.networks.some((n) => n.id === networkId)
    if (!exists) setNetworkId(asset.defaultNetworkId)
    setCopiedAll(false)
  }, [asset, networkId])

  const network = getDonationNetwork(asset, networkId) ?? asset.networks[0]

  const handleAssetChange = (next: DonationAsset) => {
    setAssetId(next.id)
    setNetworkId(next.defaultNetworkId)
  }

  const copyAll = async () => {
    const lines = [`${asset.symbol} · ${network.name}`, `Address: ${network.address}`]
    if (network.memo) lines.push(`Memo: ${network.memo}`)
    await copyText('Donation details', lines.join('\n'))
    setCopiedAll(true)
    window.setTimeout(() => setCopiedAll(false), 2000)
  }

  return (
    <article className="relative overflow-hidden rounded-xl border border-border/60 bg-card/40 p-4 backdrop-blur-md sm:p-5">
      <div className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full bg-primary/5 blur-2xl" />

      <div className="relative space-y-4">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Donation asset">
          {DONATION_ASSETS.map((item) => {
            const active = item.id === assetId
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => handleAssetChange(item)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full border px-3.5 py-2 font-mono text-xs transition-colors',
                  active
                    ? 'border-primary/50 bg-primary/10 text-foreground'
                    : 'border-border/60 bg-background/40 text-muted-foreground hover:border-border hover:text-foreground',
                )}
              >
                <AssetIcon asset={item} size="sm" />
                {item.symbol}
              </button>
            )
          })}
        </div>

        <div className="flex items-start gap-3">
          <AssetIcon asset={asset} size="lg" className="rounded-xl shadow-sm" />

          <div className="min-w-0 flex-1 space-y-3">
            <div className="space-y-1.5">
              <label
                htmlFor="donation-network"
                className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground"
              >
                Network
              </label>
              <Select value={networkId} onValueChange={setNetworkId}>
                <SelectTrigger id="donation-network" className="w-full font-mono text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {asset.networks.map((n) => (
                    <SelectItem key={n.id} value={n.id} className="font-mono text-xs">
                      {n.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {network.sendHint && (
              <p className="callout-warning rounded-md px-2.5 py-2 font-mono text-[11px] leading-relaxed">
                {network.sendHint}
              </p>
            )}

            <CopyableField label="Address" value={network.address} copyLabel="Address" />

            {network.memo && (
              <CopyableField label="Memo (required)" value={network.memo} copyLabel="Memo" />
            )}

            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="w-full gap-1.5 font-mono text-xs"
              onClick={copyAll}
            >
              {copiedAll ? (
                <Check className="size-3.5 text-primary" />
              ) : (
                <Copy className="size-3.5" />
              )}
              Copy address{network.memo ? ' + memo' : ''}
            </Button>
          </div>
        </div>
      </div>
    </article>
  )
}
