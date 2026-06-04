/** Donation config — edit addresses, memos, and network labels here. */
export interface DonationNetwork {
  id: string
  /** Shown in the network dropdown */
  name: string
  address: string
  /** Required for some chains (e.g. TON) */
  memo?: string
  /** Short warning under the address */
  sendHint?: string
}

export interface DonationAsset {
  id: string
  name: string
  symbol: string
  /** Public URL under /crypto/ (see public/crypto/) */
  iconSrc: string
  /** First network selected when switching to this asset */
  defaultNetworkId: string
  networks: DonationNetwork[]
}

const EVM = '0x461AB9D60D7819A485a8267287a2998B2623cf05'

/**
 * Ordered by typical tip popularity: stablecoin first, then ETH, then BTC.
 * Networks within each asset are ordered by common usage (BSC → Solana → TON, etc.).
 */
export const DONATION_ASSETS: DonationAsset[] = [
  {
    id: 'usdt',
    name: 'Tether',
    symbol: 'USDT',
    iconSrc: '/crypto/usdt.svg',
    defaultNetworkId: 'bsc',
    networks: [
      {
        id: 'bsc',
        name: 'BNB Smart Chain (BEP-20)',
        address: EVM,
        sendHint: 'Send USDT on BSC only — wrong network means lost funds.',
      },
      {
        id: 'solana',
        name: 'Solana (SPL)',
        address: '5NWdaCyo8ej8m7SUhp1Y4ADCr3BAnyCEypnCHajZuKDE',
        sendHint: 'Send USDT on Solana only.',
      },
      {
        id: 'ton',
        name: 'TON',
        address: 'UQDdNkQb9KqKam7P12Pv3h64Ldhr3PsUVrRf9Lc_h2VxhPeC',
        memo: '12004438139',
        sendHint: 'USDT on TON — you must include the memo or the transfer may fail.',
      },
    ],
  },
  {
    id: 'eth',
    name: 'Ethereum',
    symbol: 'ETH',
    iconSrc: '/crypto/eth.svg',
    defaultNetworkId: 'erc20',
    networks: [
      {
        id: 'erc20',
        name: 'Ethereum (ERC-20)',
        address: EVM,
        sendHint: 'ETH or ERC-20 tokens on Ethereum mainnet.',
      },
      {
        id: 'bsc',
        name: 'BNB Smart Chain (BEP-20)',
        address: EVM,
        sendHint: 'ETH/BNB or BEP-20 tokens on BSC only.',
      },
    ],
  },
  {
    id: 'btc',
    name: 'Bitcoin',
    symbol: 'BTC',
    iconSrc: '/crypto/btc.svg',
    defaultNetworkId: 'bitcoin',
    networks: [
      {
        id: 'bitcoin',
        name: 'Bitcoin',
        address: '1ERgtdd1zF2ZYiYguXfwqrry7BJRbsxoxG',
        sendHint: 'Native Bitcoin only.',
      },
      {
        id: 'bsc',
        name: 'BNB Smart Chain (BTCB)',
        address: EVM,
        sendHint: 'Wrapped BTC (BTCB) on BSC only — not native Bitcoin.',
      },
    ],
  },
]

export const DONATION_SECTION = {
  id: 'support',
  eyebrow: 'Community powered',
  title: 'Tip the melt',
  description:
    'AssetMelt is free forever and runs entirely in your browser. If it saves you time or bandwidth, a crypto tip helps keep it sharp — no accounts, no middlemen.',
  footnote:
    'Pick the asset and network before sending. Tips are voluntary and non-refundable.',
} as const

export function getDonationAsset(assetId: string): DonationAsset | undefined {
  return DONATION_ASSETS.find((a) => a.id === assetId)
}

export function getDonationNetwork(
  asset: DonationAsset,
  networkId: string,
): DonationNetwork | undefined {
  return asset.networks.find((n) => n.id === networkId)
}
