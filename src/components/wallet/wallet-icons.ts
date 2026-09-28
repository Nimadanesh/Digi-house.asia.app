// File responsibility: brand-icon URLs for the wallet picker (data only).
// EVM icons come from the WalletConnect explorer registry (stable image ids);
// TON icons come from the official ton-blockchain wallets list. Wallets without
// a verified URL get the monogram fallback (see WalletIcon). No invented URLs.

const WC = (imageId: string): string =>
  `https://explorer-api.walletconnect.com/v3/logo/sm/${imageId}?projectId=ac5babdc1e4624e38f7f85abd39d2bc4`;

const TON_ICONS: Record<string, string> = {
  tonkeeper: "https://tonkeeper.com/assets/tonconnect-icon.png",
  openmask:
    "https://raw.githubusercontent.com/OpenProduct/openmask-extension/main/public/openmask-logo-288.png",
  mytonwallet: "https://mytonwallet.io/icon-256.png",
  tonhub: "https://tonhub.com/tonconnect_logo.png",
  dewallet: "https://app.delabwallet.com/logo_black.png",
};

const WC_IMAGE_IDS: Record<string, string> = {
  metamask: "eebe4a7f-7166-402f-92e0-1f64ca2aa800",
  trust: "7677b54f-3486-46e2-4e37-bf8747814f00",
  coinbase: "04c88bf0-f115-4686-8c29-90a3d018a400",
  rainbow: "7a33d7f1-3d12-4b5c-f3ee-5cd83cb1b500",
  phantom: "b6ec7b81-bb4f-427d-e290-7631e6e50d00",
  rabby: "255e6ba2-8dfd-43ad-e88e-57cbb98f6800",
  zerion: "73f6f52f-7862-49e7-bb85-ba93ab72cc00",
  argent: "215158d2-614b-49c9-410f-77aa661c3900",
  backpack: "71ca9daf-a31e-4f2a-fd01-f5dc2dc66900",
  solflare: "34c0e38d-66c4-470e-1aed-a6fabe2d1e00",
  exodus: "4c16cad4-cac9-4643-6726-c696efaf5200",
  ledger: "a7f416de-aa03-4c5e-3280-ab49269aef00",
  safe: "3cdfc77d-fcb6-4a17-239c-5785fe847b00",
  frame: "29b4f569-c1e8-4144-132e-629bf5290f00",
  taho: "13416950-f73f-4a4c-2f22-d494ed5df800",
  keplr: "750e0f10-0700-4ca5-7c0d-b4a55da72f00",
  leap: "d64ae9c7-c0be-495d-041e-35c6bb2cc100",
  cosmostation: "ea26c3c8-adb6-4dc4-ee02-35d6eee02800",
  talisman: "7b8af324-1b14-44eb-d0b5-ca98550a6900",
  subwallet: "03f5c08c-fb30-46a0-ca5c-d8fdd7250b00",
  nova: "4f159b10-419b-483a-f2bf-da3d17855e00",
  math: "26a8f588-3231-4411-60ce-5bb6b805a700",
  tokenpocket: "cfe00608-cb9e-45e3-0d08-5ffc7f5ad200",
  imtoken: "c84b4d9d-95e5-4bb5-b373-934b46eafc00",
  bitget: "2b569b7f-e6c6-4faa-8e5a-ecd4dec8cf00",
  okx: "c55df831-3c52-49fc-d1d1-97a926dc0c00",
  bybit: "b9e64f74-0176-44fd-c603-673a45ed5b00",
  binance: "ebac7b39-688c-41e3-7912-a4fefba74600",
  crypto: "88388eb4-4471-4e72-c4b4-852d496fea00",
  oneinch: "3e60118c-b9a9-43df-7975-33ebc8014400",
  uniswap: "bff9cf1f-df19-42ce-f62a-87f04df13c00",
  robinhood: "dfe0e3e3-5746-4e2b-12ad-704608531500",
  kraken: "8909e826-63e4-42b3-60b2-8a6a54060900",
  gemini: "56a3fd87-2627-4903-fddd-205224dac500",
  atomic: "7eca0311-abf5-4902-43e9-51858403e200",
  coinomi: "3b446d16-a908-40c8-5835-9a6efe90dd00",
  enjin: "add9626b-a5fa-4c12-178c-e5584e6dcd00",
  frontier: "a78c4d48-32c1-4a9d-52f2-ec7ee08ce200",
  foxwallet: "d673068d-1acf-4372-76ee-8eb931c59e00",
  safepal: "252753e7-b783-4e03-7f77-d39864530900",
  coolwallet: "f581365d-e844-4d21-8e35-44a755a32d00",
  onekey: "2067c771-93e8-4b32-b388-b2a0e1d4dc00",
  cake: "b05af25b-fa4d-4f91-a4cb-2f8f7d544000",
  edge: "f0261e29-4981-4e16-4441-165e2d5d6300",
  ballet: "fd46e96d-350d-4922-a4a9-b2bfe7c92400",
  arculus: "f78dab27-7165-4a3d-fdb1-fcff06c0a700",
  leather: "0153454e-9313-4441-b6cf-838e3d023000",
  xverse: "785e20ef-c68c-4a85-6cb9-053443871e00",
  family: "18ba1b99-6268-4d7e-bead-260e978b1a00",
  hashpack: "8d55dd5a-7c9f-4929-d2d1-00564e41ac00",
  veworld: "afa5084b-02da-4dd4-418b-9f6410e34e00",
  xportal: "1bc53e49-1e7f-4129-4c87-3f8c7b91cb00",
  ellipal: "0a5b45a1-c974-4f41-6c14-376714478c00",
  airgap: "76bfe8cd-cf3f-4341-c33c-60da01065000",
  bitbox: "e8373489-de33-4d1f-ffdf-1c435a050e00",
  keepkey: "eb4227d9-366c-466c-db8f-ab7e45985500",
  opera: "877fa1a4-304d-4d45-ca8e-f76d1a556f00",
  sender: "6fb46282-3d15-4c8a-41ae-0d52115e3f00",
  zeal: "5416fb0b-9aec-4ffe-b7cd-c04c79ea4300",
  nightly: "7fb6e288-6d7e-4f29-d934-8b3f229c2d00",
  ethos: "8bc7fb62-6f6b-4473-2e4a-5691a646fc00",
};

/** Brand icon URL for a registry wallet id, or null when unverified (monogram fallback). */
export function walletIconUrl(walletId: string): string | null {
  if (walletId in TON_ICONS) return TON_ICONS[walletId];
  const imageId = WC_IMAGE_IDS[walletId];
  return imageId ? WC(imageId) : null;
}
