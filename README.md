# Lunar

**Your private, offline AI study tutor.** Upload your lecture slides and Lunar teaches them to you, one slide at a time, on a classroom board. It runs entirely on your computer: no account, no API keys, no internet.

**[Download for Windows](https://github.com/aduamankwahkwasi292-wq/lunar-app/releases/latest)** · **[Website](https://aduamankwahkwasi292-wq.github.io/lunar-app/)**

Built by Kwasi Kwakye & Alex Nyanteng.

---

## About this repository

This repo hosts Lunar's **website** (GitHub Pages) and its **installer downloads** (GitHub Releases). It contains no app source code.

| Path | What it is |
|---|---|
| `index.html`, `styles.css`, `app.js` | The one-page site. Plain HTML/CSS/JS, no build step. |
| `assets/img`, `assets/video` | Screenshots and screen recordings captured from the real app. |
| `assets/demo/` | The sample lecture deck used in the recordings. |
| `assets/fonts/` | Self-hosted fonts, so the site makes no third-party requests. |

## Publishing a new version

The download buttons read the **latest published release** from the GitHub API and fall back to the v1.0.0 link in `index.html` if that's unavailable. So to ship an update:

1. Create a release (for example `v1.0.1`) and attach the installer named `Lunar-Setup-<version>.exe`.
2. Publish it. The site picks up the new file name, size and SHA-256 automatically.

```powershell
gh release create v1.0.1 .\Lunar-Setup-1.0.1.exe -R aduamankwahkwasi292-wq/lunar-app --title "Lunar 1.0.1" --notes "What's new..."
```

## Verifying a download

```powershell
Get-FileHash .\Lunar-Setup-1.0.0.exe -Algorithm SHA256
```

`Lunar-Setup-1.0.0.exe` → `c231b63fd1af77ea066a3c79876c56d4668062b07c0d2873717cc32327846de7`
