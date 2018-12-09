"use strict";

const {app, BrowserWindow, Menu} = require("electron");
const ws = require("./wshandler");

let win;

function createWindow() {
    win = new BrowserWindow({
        width: 800,
        height: 800,
        resizable: false,
        show: false,
    })
    win.loadFile("../web/wosci.html");

    win.on("closed", () => {
        win = null;
    })

    // Menu.setApplicationMenu(null)

    win.once("ready-to-show", () => {
        win.show();
    })
}

app.on("ready", () => {
    createWindow();
    ws.createWebsocketServer();
})

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        if (win) {
          win.webContents.closeDevTools();
        }
        console.log("Closing window");
        ws.shutdown();
        app.quit();
    }
})
