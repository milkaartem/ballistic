const { app, BrowserWindow, Menu, shell } = require("electron");
const path = require("node:path");

const DEV_URL = process.env.BALLISTICS_DEV_URL || "";
const APP_ID = "ru.edu.ballisticslab";

app.setAppUserModelId(APP_ID);

function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 680,
    show: false,
    backgroundColor: "#071019",
    autoHideMenuBar: true,
    title: "Баллистика — лаборатория движения",
    icon: path.join(__dirname, "..", "assets", "icon.png"),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false
    }
  });

  window.once("ready-to-show", () => window.show());

  window.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    return { action: "deny" };
  });

  window.webContents.on("will-navigate", (event, url) => {
    const allowed = DEV_URL ? url.startsWith(DEV_URL) : url.startsWith("file://");
    if (!allowed) event.preventDefault();
  });

  if (DEV_URL) {
    window.loadURL(DEV_URL);
  } else {
    window.loadFile(path.join(__dirname, "..", "index.html"));
  }

  if (!app.isPackaged) {
    window.webContents.on("before-input-event", (event, input) => {
      if (input.type === "keyDown" && input.key === "F12") {
        window.webContents.toggleDevTools();
        event.preventDefault();
      }
    });
  }

  return window;
}

Menu.setApplicationMenu(null);

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
