<p align="center">
  <img src="assets/images/QPortal_logo_complete.svg" width="260" alt="QPortal logo" />
</p>

<h1 align="center">QPortal</h1>

<p align="center">
  <b>The QChain web portal for issuers, verifiers and IT admins.</b><br/>
  Issue, manage and verify post-quantum digital credentials from the browser, backed by a Hyperledger Fabric network whose every identity is ML-DSA-44.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Flutter-3.44-027DFD" alt="Flutter" />
  <img src="https://img.shields.io/badge/Platform-Web-4285F4" alt="Web" />
  <img src="https://img.shields.io/badge/Hosting-Vercel-000000" alt="Vercel" />
  <img src="https://img.shields.io/badge/PQC-ML--DSA--44-6E40C9" alt="ML-DSA-44" />
  <img src="https://img.shields.io/badge/License-Proprietary-red" alt="License" />
</p>

---

## 🌐 Live Demo

QPortal is hosted on Vercel. Open it in any browser; there is nothing to install:

| App | What it is | Link |
|-----|-----------|------|
| **QPortal** | Issuer / Verifier / IT-Admin web portal | **<VERCEL_URL>** |

> ⚠️ **It's a live demo, not production.** The portal itself is served from Vercel's CDN, but the API it calls
> runs on our university VM, so data may be unavailable at times. The demo database is shared by everyone,
> and access is open to anyone with the link.

> **Looking for the holder app?** QWallet is a mobile install, not a web app: see
> [qchain-wallet](https://github.com/teamqchain/qchain-wallet).

---

## Overview

**QChain** is a post-quantum credential system. Each credential carries an issuer signature made with
**ML-DSA-44 (CRYSTALS-Dilithium)** and is anchored on a permissioned **Hyperledger Fabric** ledger. The credential's
attributes live only on **IPFS**, encrypted to the holder's **ML-KEM-768** key.

**QPortal** is the organisations' side of QChain. It serves three roles:

| Role | Who | What they do in QPortal |
|------|-----|-------------------------|
| **Issuer** | universities and authorities | issue single or batch credentials, define credential schemas, list all credentials, open a credential's detail, suspend, revoke or restore |
| **Verifier** | employers and institutions | verify a presentation manually or by scanning the holder's QR code, verify in batches, keep a verification history, set verification policies, subscribe to credentials and receive alerts when one is suspended or revoked |
| **IT Admin** | the organisation's administrators | manage staff, read the audit log, manage the organisation profile, view the cryptographic settings, handle requests and capabilities |

QPortal **never decrypts credential attributes.** The credential body is encrypted to the holder's own key, and only
QWallet on the holder's phone can open it. The portal works with the signed on-chain record (status, dates, salted
field hashes) and with exactly the fields a holder chooses to disclose.

---

## Architecture

```
                 Browser
                    │  HTTPS
                    ▼
     QPortal  ·  static Flutter web build  ·  Vercel CDN
                    │
                    │  JSON API calls to API_BASE_URL (cross-origin, allowed by the backend's CORS)
                    ▼
     https://qchain.tail4fff4b.ts.net/api   ──  Tailscale Funnel  ──▶  gateway (Nginx)
                                                                          │
                                                                          ▼
                                                       Go REST API  ·  qchain-backend
                                             ┌───────────────────┬───────────────┬──────────────┐
                                             ▼                   ▼               ▼              ▼
                                     Hyperledger Fabric       IPFS            MySQL       ML-DSA-44 /
                                     (ML-DSA-44 network)   (encrypted      (IDs, staff,   ML-KEM-768
                                                            envelopes)      sessions)
```

- **Static hosting.** `flutter build web` produces plain HTML, JavaScript and assets; Vercel serves them from its CDN.
- **API address.** The backend URL is compiled into the app with `--dart-define=API_BASE_URL=…`
  (`lib/utils/webApp_config.dart`). Without it, the app uses `http://localhost:3000` for local development.
- **Path URLs.** The portal uses path-style URLs (`usePathUrlStrategy()`), so `vercel.json` rewrites every
  unknown path to `index.html`; refreshing `/dashboard` works.
- **Certificate rendering** comes from the shared package [qchain-shared](https://github.com/teamqchain/qchain-shared),
  which QWallet uses too.

---

## Technology stack

| Layer | Technology |
|-------|------------|
| Framework | Flutter 3.44 (web), Dart ^3.9.2 |
| State management and routing | GetX (`get` ^4.7.3) |
| HTTP | `http` ^1.6.0 |
| QR scanning in the browser | `mobile_scanner` ^7.2.0 |
| Graphics and icons | `flutter_svg`, `font_awesome_flutter`, `cupertino_icons` |
| Certificate template and viewer | `qchain_shared` (git dependency on qchain-shared) |
| Hosting | Vercel (static build, preview deployments for branches) |

---

## Repository structure

```
qchain-portal/
├── lib/
│   ├── main.dart                 # entry point: path URL strategy, routes
│   ├── screens/                  # dashboard + issuer/, verifier/ and IT Admin/ pages
│   ├── components/ widgets/      # reusable UI pieces (badges, pagination, cards)
│   ├── dialog/ tables/           # dialogs and data tables
│   ├── models/                   # ISSUER/, VERIFIER/, IT_ADMIN/ and helper models
│   ├── services/                 # API clients that talk to the backend
│   ├── routes/ view/ theme/      # navigation, page layout, colours and text styles
│   └── utils/                    # webApp_config.dart (API_BASE_URL) and helpers
├── assets/                       # fonts and logos
├── web/                          # index.html, manifest, icons
├── test/                         # widget tests
├── android/ ios/ linux/ macos/ windows/   # Flutter platform folders (only web is deployed)
├── scripts/vercel-build.sh       # Vercel build: installs Flutter 3.44.0, builds the web app
├── vercel.json                   # Vercel settings + rewrite of every path to index.html
├── pubspec.yaml · pubspec.lock   # dependencies (qchain_shared pinned by commit in the lock file)
└── LICENSE
```

---

## Getting started

### Prerequisites

- Flutter **3.44.0** with web support, and Chrome
- Network access to the QChain API (the public demo API, or a backend running locally from qchain-backend)

### 1. Clone

```bash
git clone https://github.com/teamqchain/qchain-portal.git
cd qchain-portal
```

### 2. Install the dependencies

```bash
flutter pub get        # also fetches qchain-shared from GitHub
```

### 3. Run

```bash
# against the public demo API
flutter run -d chrome --dart-define=API_BASE_URL=https://qchain.tail4fff4b.ts.net/api

# against a backend on this machine (the default when API_BASE_URL is not set)
flutter run -d chrome
```

### 4. Build

```bash
flutter build web --release --dart-define=API_BASE_URL=https://qchain.tail4fff4b.ts.net/api
# output: build/web/
```

---

## Deployment

QPortal deploys itself through Vercel's GitHub integration:

- **Push to `main`** → Vercel runs `scripts/vercel-build.sh` and publishes the new version to production.
- **Push to any other branch, or open a pull request** → Vercel builds a separate preview URL.
- **`API_BASE_URL`** is set in the Vercel project's environment variables, for both Production and Preview.

> ⚠️ On Vercel's free plan, automatic deployments only go through for commits by the GitHub account connected to the
> Vercel account. If a deployment shows **Blocked**, redeploy it from the Vercel dashboard.

---

## Working with qchain-shared

The certificate template and viewer live in [qchain-shared](https://github.com/teamqchain/qchain-shared) so that one
change shows up in both QPortal and QWallet.

- **Taking a shared update:** `flutter pub upgrade qchain_shared`, check the app, commit `pubspec.lock`, push.
  `pubspec.lock` pins the exact commit, so a change in shared never reaches the portal until you take it.
- **Editing shared and the portal together:** clone both side by side and create `pubspec_overrides.yaml`
  (gitignored):

  ```yaml
  dependency_overrides:
    qchain_shared:
      path: ../qchain-shared
  ```

  Delete it and run `flutter pub get` before committing a `pubspec.lock` change.

---

## Related repositories

| Repository | What it holds |
|------------|---------------|
| [qchain-portal](https://github.com/teamqchain/qchain-portal) | QPortal, the web portal (this repository) |
| [qchain-wallet](https://github.com/teamqchain/qchain-wallet) | QWallet, the holder's mobile app |
| [qchain-shared](https://github.com/teamqchain/qchain-shared) | the shared Flutter package: certificate template and viewer |
| [qchain-backend](https://github.com/teamqchain/qchain-backend) | the Go REST API, MySQL schema, gateway, CI/CD and end-to-end tests |
| [qchain-network](https://github.com/teamqchain/qchain-network) | the Hyperledger Fabric network with ML-DSA-44 identities, and the chaincode |
| [qchain-docs](https://github.com/teamqchain/qchain-docs) | reports, the setup guide and the preliminary benchmarks |
| [qchain-kpi](https://github.com/teamqchain/qchain-kpi) | the post-quantum performance benchmarks |
| [teamqchain.github.io](https://github.com/teamqchain/teamqchain.github.io) | the project website |

Some of these repositories are private.

---

## Team

A University of Sharjah capstone project, supervised by **Dr. Manar Abu Talib** and **Dr. Sohail Abbas**.

| Member | Role |
|--------|------|
| Mohammed Bin Ali Maqqavi ([@M0hd-Maqqavi](https://github.com/M0hd-Maqqavi)) | Project Manager |
| Mohammed Abdul Haris ([@mohammed-ah-14](https://github.com/mohammed-ah-14)) | Technical Lead |
| Mohammed Nihal ([@nihvp](https://github.com/nihvp)) | Quality Assurance Lead |
| Mohammed Obeid ([@MohammedObeid88](https://github.com/MohammedObeid88)) | Blockchain Specialist |

---

## License

**Proprietary — all rights reserved.** © 2026 QChain. This source code is proprietary and confidential;
unauthorized copying, modification, distribution, or use is prohibited without prior written permission.
See [LICENSE](LICENSE).

---

## Disclaimer

This is an academic research project, not a production system. The public demo uses seed/demo data on a shared
database, and the portal's API calls are not yet gated behind staff authentication (tracked for a future
session/login system). Credential confidentiality is implemented today: attributes are encrypted end-to-end to a
key pair held only on the holder's device, so the portal never sees them.
