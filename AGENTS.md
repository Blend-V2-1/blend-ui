# Repository Instructions

## Deployment identity

- This repository is the source for the Blend V2.1 mainnet UI at
  `https://blnd.trade`.
- The `main` branch is automatically deployed to `https://blnd.trade`.
- Use this local checkout to inspect the site's source. Do not fetch or scrape
  the live site merely to determine what the repository deploys.
- Do not confuse `blnd.trade` (Blend V2.1 mainnet) with `blnt.trade` (BLNT V3
  mainnet) or `blent.trade` (BLNT V3 testnet).

## Local development server

- Use `http://localhost:3002` by default unless the user explicitly requests a
  different port.
- Before starting or restarting the UI, check for a listener on the selected
  TCP port, whether it is the default or an explicit override. If a process
  owns the port, terminate that exact process gracefully and wait for the port
  to become available.
- Start the default server with `npm run dev -- -p 3002`. Do not accept
  Next.js's automatic fallback to a different port; only use another port when
  the user explicitly overrides the default, and pass that port with `-p`.

Do not commit, push, or publish changes unless the user explicitly requests it.
