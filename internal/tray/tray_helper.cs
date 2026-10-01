using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Net;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using System.Windows.Forms;

public class TrayHelperApp {
    [DllImport("user32.dll", SetLastError = true)]
    static extern IntPtr OpenDesktop(string lpszDesktop, uint dwFlags, bool fInherit, uint dwDesiredAccess);

    [DllImport("user32.dll", SetLastError = true)]
    static extern bool SetThreadDesktop(IntPtr hDesktop);

    private static NotifyIcon trayIcon;
    private static string apiBase = "http://127.0.0.1:4040";
    private static string localToken = "";
    private static int parentPid = 0;

    [STAThread]
    public static void Main(string[] args) {
        // Ensure thread is attached to user's interactive Default desktop
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

        // Load Icon from embedded resource or fallback
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

        // Monitor parent process if PID was provided
        if (parentPid > 0) {
            Thread monitorThread = new Thread(() => {
                try {
                    Process parent = Process.GetProcessById(parentPid);
                    parent.WaitForExit();
                } catch {
                    // Parent process not running or inaccessible
                }
                ExitTray();
            });
            monitorThread.IsBackground = true;
            monitorThread.Start();
        }

        Application.Run();
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
            if (trayIcon != null) {
                trayIcon.Visible = false;
                trayIcon.Dispose();
            }
        } catch { }
        Application.Exit();
    }
}
