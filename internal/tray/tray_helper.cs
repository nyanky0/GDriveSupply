using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Net;
using System.Runtime.InteropServices;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using System.Windows.Forms;

public class TrayHelperApp {
    [DllImport("user32.dll", SetLastError = true)]
    static extern IntPtr OpenDesktop(string lpszDesktop, uint dwFlags, bool fInherit, uint dwDesiredAccess);

    [DllImport("user32.dll", SetLastError = true)]
    static extern bool SetThreadDesktop(IntPtr hDesktop);

    private static NotifyIcon trayIcon;
    private static TransferProgressForm progressForm;
    private static string apiBase = "http://127.0.0.1:4040";
    private static string localToken = "";
    private static int parentPid = 0;
    private static int idleCounter = 0;

    [STAThread]
    public static void Main(string[] args) {
        // Attach to user interactive Default desktop
        try {
            IntPtr hDef = OpenDesktop("Default", 0, false, 0x01FF);
            if (hDef != IntPtr.Zero) {
                SetThreadDesktop(hDef);
            }
        } catch { }

        string iconPath = null;
        for (int i = 0; i < args.Length; i++) {
            if (args[i] == "--port" && i + 1 < args.Length) {
                apiBase = "http://127.0.0.1:" + args[i + 1];
            } else if (args[i] == "--pid" && i + 1 < args.Length) {
                int.TryParse(args[i + 1], out parentPid);
            } else if (args[i] == "--token" && i + 1 < args.Length) {
                localToken = args[i + 1];
            } else if (args[i] == "--icon" && i + 1 < args.Length) {
                iconPath = args[i + 1];
            }
        }

        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);

        trayIcon = new NotifyIcon();
        trayIcon.Text = "GDrive Supply (Aktif)";

        // Load Icon from embedded resource or path
        try {
            if (!string.IsNullOrEmpty(iconPath) && File.Exists(iconPath)) {
                trayIcon.Icon = new Icon(iconPath);
            } else {
                trayIcon.Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath) ?? SystemIcons.Application;
            }
        } catch {
            trayIcon.Icon = SystemIcons.Application;
        }

        // Build Context Menu
        ContextMenu menu = new ContextMenu();
        menu.MenuItems.Add(new MenuItem("🌐 Buka Web Dashboard", (s, e) => OpenWeb()));
        menu.MenuItems.Add(new MenuItem("📁 Buka File Explorer", (s, e) => OpenExplorer()));
        menu.MenuItems.Add(new MenuItem("-"));
        menu.MenuItems.Add(new MenuItem("❌ Matikan GDrive Supply Saja", (s, e) => Shutdown(false)));
        menu.MenuItems.Add(new MenuItem("🛑 Matikan App + WinFsp Service", (s, e) => Shutdown(true)));

        trayIcon.ContextMenu = menu;
        trayIcon.Visible = true;

        try {
            trayIcon.ShowBalloonTip(3000, "GDrive Supply Aktif", "Drive Google Cloud siap digunakan. Klik 2x untuk membuka web dashboard.", ToolTipIcon.Info);
        } catch { }

        // Double click opens web dashboard
        trayIcon.DoubleClick += (s, e) => OpenWeb();

        // Initialize Native Windows Transfer Progress Form
        progressForm = new TransferProgressForm();

        // Monitor parent process if PID was provided
        if (parentPid > 0) {
            Thread monitorThread = new Thread(() => {
                try {
                    Process parent = Process.GetProcessById(parentPid);
                    parent.WaitForExit();
                } catch { }
                ExitTray();
            });
            monitorThread.IsBackground = true;
            monitorThread.Start();
        }

        // Start live upload monitoring thread
        StartTransferMonitor();

        Application.Run();
    }

    private static void StartTransferMonitor() {
        Thread t = new Thread(() => {
            while (true) {
                Thread.Sleep(500);
                try {
                    PollTransfers();
                } catch { }
            }
        });
        t.IsBackground = true;
        t.Start();
    }

    private static void PollTransfers() {
        try {
            string url = apiBase + "/api/transfers";
            HttpWebRequest req = (HttpWebRequest)WebRequest.Create(url);
            req.Method = "GET";
            req.Timeout = 800;
            if (!string.IsNullOrEmpty(localToken)) {
                req.Headers.Add("X-Local-Tray-Token", localToken);
            }

            string json = "";
            using (HttpWebResponse resp = (HttpWebResponse)req.GetResponse()) {
                using (StreamReader sr = new StreamReader(resp.GetResponseStream())) {
                    json = sr.ReadToEnd();
                }
            }

            if (string.IsNullOrEmpty(json)) return;

            bool isActive = json.IndexOf("\"active\":true", StringComparison.OrdinalIgnoreCase) >= 0;

            if (isActive) {
                idleCounter = 0;
                string name = MatchString(json, "\"name\":\\s*\"([^\"]+)\"");
                string drive = MatchString(json, "\"driveLetter\":\\s*\"([^\"]+)\"");
                string pctStr = MatchString(json, "\"percentage\":\\s*([0-9]+)");
                string bytesStr = MatchString(json, "\"bytesFormatted\":\\s*\"([^\"]+)\"");
                string sizeStr = MatchString(json, "\"sizeFormatted\":\\s*\"([^\"]+)\"");
                string speedStr = MatchString(json, "\"speedFormatted\":\\s*\"([^\"]+)\"");
                string etaStr = MatchString(json, "\"etaFormatted\":\\s*\"([^\"]+)\"");

                int pct = 0;
                int.TryParse(pctStr, out pct);

                string title = string.IsNullOrEmpty(drive) ? "☁️ Mengunggah ke Google Drive" : "☁️ Mengunggah ke Drive (" + drive + ")";
                string fileName = string.IsNullOrEmpty(name) ? "Memproses berkas..." : name;
                string metrics = string.Format("{0} / {1} ({2}%) • {3} • Sisa: {4}", bytesStr, sizeStr, pct, speedStr, etaStr);

                if (progressForm != null && progressForm.IsHandleCreated) {
                    progressForm.BeginInvoke((MethodInvoker)(() => {
                        progressForm.UpdateTransfer(title, fileName, pct, metrics);
                    }));
                }
            } else {
                if (progressForm != null && progressForm.IsHandleCreated && progressForm.Visible) {
                    idleCounter++;
                    if (idleCounter == 1) {
                        progressForm.BeginInvoke((MethodInvoker)(() => {
                            progressForm.MarkCompleted();
                        }));
                    } else if (idleCounter >= 4) { // ~2 seconds after completion
                        progressForm.BeginInvoke((MethodInvoker)(() => {
                            progressForm.Hide();
                        }));
                    }
                }
            }
        } catch { }
    }

    private static string MatchString(string input, string pattern) {
        Match m = Regex.Match(input, pattern, RegexOptions.IgnoreCase);
        if (m.Success && m.Groups.Count > 1) {
            return m.Groups[1].Value;
        }
        return "";
    }

    private static void OpenWeb() {
        try {
            Process.Start(new ProcessStartInfo {
                FileName = apiBase,
                UseShellExecute = true
            });
        } catch { }
    }

    private static void OpenExplorer() {
        try {
            Process.Start("explorer.exe");
        } catch { }
    }

    private static void Shutdown(bool withWinFsp) {
        try {
            string url = apiBase + "/api/system/shutdown";
            HttpWebRequest req = (HttpWebRequest)WebRequest.Create(url);
            req.Method = "POST";
            req.ContentType = "application/json";
            req.Timeout = 3000;
            if (!string.IsNullOrEmpty(localToken)) {
                req.Headers.Add("X-Local-Tray-Token", localToken);
            }

            byte[] body = Encoding.UTF8.GetBytes("{\"withWinFsp\":" + (withWinFsp ? "true" : "false") + "}");
            req.ContentLength = body.Length;
            using (Stream s = req.GetRequestStream()) {
                s.Write(body, 0, body.Length);
            }

            try {
                using (HttpWebResponse resp = (HttpWebResponse)req.GetResponse()) { }
            } catch { }
        } catch { }

        ExitTray();
    }

    private static void ExitTray() {
        try {
            if (progressForm != null) {
                progressForm.Hide();
                progressForm.Dispose();
            }
            if (trayIcon != null) {
                trayIcon.Visible = false;
                trayIcon.Dispose();
            }
        } catch { }
        Application.Exit();
    }
}

// Native Windows Lightweight Transfer Progress Dialog
public class TransferProgressForm : Form {
    private Label lblTitle;
    private Label lblFileName;
    private ProgressBar progressBar;
    private Label lblMetrics;
    private Button btnClose;
    private bool userDismissed = false;
    private string lastFile = "";

    public TransferProgressForm() {
        this.FormBorderStyle = FormBorderStyle.None;
        this.ShowInTaskbar = false;
        this.TopMost = true;
        this.StartPosition = FormStartPosition.Manual;
        this.Size = new Size(390, 130);
        this.BackColor = Color.FromArgb(250, 250, 252);
        this.Padding = new Padding(14);

        int screenRight = Screen.PrimaryScreen.WorkingArea.Right;
        int screenBottom = Screen.PrimaryScreen.WorkingArea.Bottom;
        this.Location = new Point(screenRight - 406, screenBottom - 146);

        // 1px Border drawing for clean contrast
        this.Paint += (s, e) => {
            using (Pen p = new Pen(Color.FromArgb(209, 213, 219), 1)) {
                e.Graphics.DrawRectangle(p, 0, 0, this.Width - 1, this.Height - 1);
            }
        };

        // Header Title
        lblTitle = new Label();
        lblTitle.Text = "☁️ Mengunggah ke Google Drive";
        lblTitle.Font = new Font("Segoe UI", 9.5f, FontStyle.Bold);
        lblTitle.ForeColor = Color.FromArgb(17, 24, 39);
        lblTitle.Location = new Point(14, 12);
        lblTitle.Size = new Size(330, 20);
        this.Controls.Add(lblTitle);

        // Dismiss / Close button
        btnClose = new Button();
        btnClose.Text = "✕";
        btnClose.Font = new Font("Segoe UI", 8.5f);
        btnClose.ForeColor = Color.FromArgb(107, 114, 128);
        btnClose.FlatStyle = FlatStyle.Flat;
        btnClose.FlatAppearance.BorderSize = 0;
        btnClose.Location = new Point(356, 8);
        btnClose.Size = new Size(24, 24);
        btnClose.Cursor = Cursors.Hand;
        btnClose.Click += (s, e) => {
            userDismissed = true;
            this.Hide();
        };
        this.Controls.Add(btnClose);

        // File name
        lblFileName = new Label();
        lblFileName.Text = "Menyiapkan berkas...";
        lblFileName.Font = new Font("Segoe UI", 9f, FontStyle.Regular);
        lblFileName.ForeColor = Color.FromArgb(55, 65, 81);
        lblFileName.Location = new Point(14, 36);
        lblFileName.Size = new Size(362, 18);
        lblFileName.AutoEllipsis = true;
        this.Controls.Add(lblFileName);

        // Progress bar
        progressBar = new ProgressBar();
        progressBar.Location = new Point(14, 60);
        progressBar.Size = new Size(362, 18);
        progressBar.Style = ProgressBarStyle.Continuous;
        progressBar.Minimum = 0;
        progressBar.Maximum = 100;
        this.Controls.Add(progressBar);

        // Metrics: speed, size, eta
        lblMetrics = new Label();
        lblMetrics.Text = "0 B • 0 KB/s";
        lblMetrics.Font = new Font("Segoe UI", 8.5f, FontStyle.Regular);
        lblMetrics.ForeColor = Color.FromArgb(75, 85, 99);
        lblMetrics.Location = new Point(14, 88);
        lblMetrics.Size = new Size(362, 20);
        lblMetrics.AutoEllipsis = true;
        this.Controls.Add(lblMetrics);

        // Force handle creation on the UI thread without showing immediately
        IntPtr h = this.Handle;
    }

    protected override bool ShowWithoutActivation {
        get { return true; } // Do not steal focus from user
    }

    public void UpdateTransfer(string title, string fileName, int percent, string metrics) {
        if (fileName != lastFile) {
            userDismissed = false; // Reset dismiss when a new file begins
            lastFile = fileName;
        }
        if (userDismissed) return;

        lblTitle.Text = title;
        lblFileName.Text = fileName;
        progressBar.Value = Math.Max(0, Math.Min(100, percent));
        lblMetrics.Text = metrics;

        if (!this.Visible) {
            this.Show();
        }
    }

    public void MarkCompleted() {
        if (userDismissed) return;
        progressBar.Value = 100;
        lblMetrics.Text = "Selesai 100% ✔ • Berkas tersimpan di Google Cloud";
    }
}
