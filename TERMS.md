# Terms of Service for GDrive Supply

**Effective Date:** October 1, 2026

By installing, running, or compiling GDrive Supply ("the software"), you agree to be bound by these Terms of Service.

---

## 1. Description of Service

GDrive Supply is an open-source, local-first utility for Microsoft Windows that enables users to mount their own Google Drive accounts as virtual local disk drives using the Windows File System Proxy (WinFsp).

---

## 2. Personal Credentials & API Usage

- GDrive Supply requires users to supply their own Google Cloud Console OAuth 2.0 Client credentials or use an authorized test account invitation.
- You are responsible for complying with Google's Terms of Service and acceptable use policies when uploading or managing files through your Google Drive accounts.
- The software communicates directly with Google's servers over TLS 1.3 without intermediary proxies.

---

## 3. Local Master Password & Emergency Kill Switch

- Users may optionally enable master password protection to secure access to the local management web dashboard.
- **Panic Wipe Warning:** The software includes an automated brute-force protection mechanism. Entering an incorrect password 5 consecutive times will trigger an automated factory reset that unmounts all drives and purges local configuration files (`config.json`). The developers are not liable for the inconvenience of having to reconfigure credentials after a panic wipe.

---

## 4. Disclaimer of Warranty

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES, OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT, OR OTHERWISE, ARISING FROM, OUT OF, OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

---

## 5. Source Code & License

GDrive Supply is licensed under the MIT License. The complete source code is maintained at [https://github.com/nyanky0/GDriveSupply](https://github.com/nyanky0/GDriveSupply).
