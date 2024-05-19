import { app, BrowserWindow } from "electron";
import * as path from "path";


function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
    width: 1000,
  });

  mainWindow.loadFile(path.join(__dirname, "./views/index.html"));

  mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});


// close program when all windows are closed
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});