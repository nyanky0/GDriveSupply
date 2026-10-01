# Privacy Policy for GDrive Supply

**Effective Date:** October 1, 2026  
**Last Updated:** October 1, 2026

GDrive Supply ("we", "our", or "the application") is an open-source, local-first desktop application developed for Microsoft Windows. This Privacy Policy describes how GDrive Supply handles your information when you connect your Google Drive accounts.

---

## 1. Core Principle: Pure Local Execution (Zero-Cloud Relay)

GDrive Supply is strictly designed as a **client-side daemon**. The application runs on your local machine (`127.0.0.1:4040`) and connects directly to official Google API endpoints. 

- **No Remote Servers:** We operate no central servers, telemetry engines, or cloud databases.
- **Zero Third-Party Relays:** Your Google Drive files, directory structures, and OAuth tokens never pass through any intermediary proxy or third-party cloud.
- **No Data Monetization:** We never sell, lease, or monetize user data under any circumstances.

---

## 2. Google User Data Accessed & Handled

When you connect an account, GDrive Supply requests the following Google OAuth 2.0 scopes:

| Scope | Purpose | Retention |
| :--- | :--- | :--- |
| `https://www.googleapis.com/auth/drive` | Read, create, and modify files requested through Windows File Explorer via the virtual filesystem (WinFsp). | Streamed on-demand; file contents are not copied to third-party destinations. |
| `https://www.googleapis.com/auth/userinfo.email` | Display the connected Google account identity on your local dashboard. | Stored locally in `%APPDATA%\GDriveSupply\config.json`. |
| `https://www.googleapis.com/auth/userinfo.profile` | Display your account display name and user ID for drive labeling. | Stored locally in `%APPDATA%\GDriveSupply\config.json`. |

---

## 3. Cryptographic Storage & Windows DPAPI

All sensitive configuration data, including:
- Google OAuth Client ID & Client Secret
- OAuth Refresh Tokens
- Virtual drive mapping configurations

are encrypted on your local storage using the **Windows Data Protection API (DPAPI)**. DPAPI utilizes cryptographic keys tied directly to your Windows user logon credentials. Even if unauthorized files are copied from your hard drive, they cannot be decrypted on another computer or by another Windows user profile.

---

## 4. Google API Services User Data Policy Compliance

GDrive Supply strictly adheres to the [Google API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy), including the **Limited Use** requirements:

1. **Human Review Prohibition:** No humans (including developers of GDrive Supply) have access to or can inspect your Google Drive files or personal account metadata.
2. **AI Model Training Prohibition:** We do not use Google Workspace or Google Drive data to train, fine-tune, or validate any artificial intelligence (AI) or machine learning (ML) models.
3. **Advertising Prohibition:** Google user data is never used for serving advertisements, marketing profiling, or retargeting.

---

## 5. Security & Emergency Kill Switch Protocol

GDrive Supply incorporates local security protection:
- **Master Password Protection:** Optional master password system utilizing modern `bcrypt` key derivation (cost factor 12) with zero-residual hash storage when disabled.
- **Panic Wipe (Kill Switch):** If 5 consecutive incorrect master password attempts are detected, the system automatically triggers an emergency factory wipe: unmounting all virtual drives, purging `%APPDATA%\GDriveSupply\config.json`, and clearing all active sessions from memory.

---

## 6. User Control & Revocation

You retain complete sovereignty over your data:
- **Local Removal:** You can disconnect any drive or erase credentials at any time via the local Web Dashboard (`http://127.0.0.1:4040`).
- **Google Account Revocation:** You can immediately revoke GDrive Supply's OAuth access at any time via your Google Account Security Dashboard: [https://myaccount.google.com/permissions](https://myaccount.google.com/permissions).

---

## 7. Open Source & Auditability

The complete source code of GDrive Supply is publicly auditable on GitHub:  
[https://github.com/nyanky0/GDriveSupply](https://github.com/nyanky0/GDriveSupply)

For privacy-related inquiries or security audits, please submit an issue on the official GitHub repository.
