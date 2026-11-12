# Repository Instructions

## Deployment identity

- This repository is the source for the `https://blnd.trade` portal.
- The `main` branch is automatically deployed to `https://blnd.trade`.
- The portal provides the same BLNT V3 and supported Blend market interface as
  `https://blnt.trade`. Keep shared application behavior, content, contracts,
  branding, and banners aligned with the mainnet UI at
  `../../blnt-v3-migration/blnt-ui`.
- Preserve the intentional portal-specific differences: the `blnd.trade`
  domain and legal URLs, its existing WalletConnect project and identity, and
  its local development port.
- Use this local checkout to inspect the portal source. Do not fetch or scrape
  the live site merely to determine what the repository deploys.
- Do not confuse `blnd.trade` (this mainnet portal), `blnt.trade` (the primary
  mainnet site), or `blent.trade` (the testnet site).

## Local development server

- Use `http://localhost:3002` by default unless the user explicitly requests a
  different port.
- Before starting or restarting the UI, check for a listener on the selected
  TCP port, whether it is the default or an explicit override. If a process
  owns the port, terminate that exact process gracefully and wait for the port
  to become available.
- Start the default server with `npm run dev`. The package script binds to port
  3002. For an explicit override, use `npx next dev -p <port>`. Do not accept
  Next.js's automatic fallback to a different port.

Do not commit, push, or publish changes unless the user explicitly requests it.
