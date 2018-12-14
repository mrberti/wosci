"use strict";

/******************************************************************************
 * WosciSettings
 */
function WosciSettings() {
    /* Style settings */
    this.backgroundColor = "#111";
    this.borderColor = "#333";
    this.gridColor = "#444";
    this.gridLineDash = [2, 3];
    this.dataLineColor = [
        "#0066ff",
        "#ff4400",
        "#ffcc00",
        "#009900",
        "#cc00ff",
        "#00b8e6",
        "#e6005c",
        "#d9d9d9",
        "#00cc00",
        "#ff8000",
    ];
}

/******************************************************************************
 * WosciUI
 */
function WosciUI() {
    this.elBtnConnect = document.getElementById("btnConnect");
    this.elBtnClose = document.getElementById("btnClose");
    this.elEdRemoteAddress = document.getElementById("edRemoteAddress");
    this.elEdRemotePort = document.getElementById("edRemotePort");
    this.elYLimMin = document.getElementById("edYLimMin");
    this.elYLimMax = document.getElementById("edYLimMax");
    this.elEnableGrid = document.getElementById("cbEnableGrid");
    this.elMessageList = document.getElementById("message-list");
    this.elLogo = document.getElementById("logo");
    this.elSidebar = document.getElementById("sidebar");
    this.elSVGPlotter = document.getElementById("svg-plotter");
    this.canvas = document.getElementById("wosci_canvas");
    this.context = this.canvas.getContext("2d");

    /* Assign callbacks on button clicks */
    var self = this;
    this.elLogo.onclick = function() {
        self.elSidebar.classList.toggle("hidden");
    }

    this.elBtnClose.onclick = function() {
        Wosci.websocket.close();
    }

    this.elBtnConnect.onclick = function() {
        var remoteAddress = self.elEdRemoteAddress.value;
        var remotePort = self.elEdRemotePort.value;
        Wosci.settings.remoteAddress = remoteAddress;
        Wosci.settings.remotePort = remotePort;
        Wosci.websocket.connect(remoteAddress, remotePort);
    }
}

WosciUI.prototype.getYLimits = function() {
    return [this.elYLimMin.value, this.elYLimMax.value];
}

WosciUI.prototype.removeMessage = function (elMessage) {
    this.elMessageList.removeChild(elMessage);
}

WosciUI.prototype.showMessage = function(message, type = "info") {
    var elNewMessage = document.createElement("li");
    let self = this;
    elNewMessage.className = type;
    var timeout = setTimeout(function() { self.removeMessage(elNewMessage); }, 5000);
    elNewMessage.onclick = function() {
        clearTimeout(timeout);
        self.removeMessage(elNewMessage);
    };
    elNewMessage.appendChild(document.createTextNode(message));
    this.elMessageList.append(elNewMessage);
}

/******************************************************************************
 * WosciWebSocket
 */
function WosciWebSocket() {
    this.webSocket = null;
    this.dataVectors = {};
}

WosciWebSocket.prototype.messageHandler = function (event) {
    try {
        var packet = JSON.parse(event.data);
    }
    catch {
        console.log("Received packet was not a valid JSON object.");
        return;
    }
    let p = document.getElementById("p1");
    p.innerHTML = event.data;
    
    if (!("packetType" in packet)) {
        console.log("Got invalid message.");
        console.log(packet);
        return;
    }
    if (packet["packetType"] == "dataVectors") {
        let dataVectors = {};
        dataVectors.vectorCount = parseInt(packet["dataVectorsCount"]);
        dataVectors.vectors = packet["dataVectors"];
        this.dataVectors = dataVectors;
    }
}

WosciWebSocket.prototype.connect = function(remoteAddress, remotePort) {
    /* Check if the websocket is already up an running */
    if (this.webSocket) {
        if (this.webSocket.readyState == 1) {
            Wosci.ui.showMessage("Websocket already running.", "warning")
            return;
        }
    }
    /* Create a new websocket object */
    let serverString = "ws://"+remoteAddress+":"+remotePort+"/";;
    this.webSocket = new WebSocket(serverString);
    Wosci.ui.showMessage("New WebSocket created: " + serverString)
    console.log("New Websocket created: " + serverString);

    /* Define Websocket callbacks */
    let self = this;
    let p = document.getElementById("p1");
    this.webSocket.onmessage = function(event) {
        self.messageHandler(event);
    };
    this.webSocket.onerror = function(event) {
        Wosci.ui.showMessage("WebSocket: A wild error appeared", "error");
        this.WebSocket.close();
        console.log(event);
        p.innerHTML = JSON.stringify(event);
    };
    this.webSocket.onclose = function (event) {
        Wosci.ui.showMessage("The WebSocket was closed", "info");
        console.log("Websocket Closed.");
        p.innerHTML = "Connection Closed";
    }
}

WosciWebSocket.prototype.getDataVectors = function() {
    return this.dataVectors;
}

WosciWebSocket.prototype.close = function() {
    try { 
        this.webSocket.close();
    }
    catch(error) {
        console.log("Could not close websocket.");
    }
}

/******************************************************************************
 * WosciSVGPlotter
 */
function WosciSVGPlotter() {
    this.data = {};
}

WosciSVGPlotter.prototype.draw = function() {
    this.data = Wosci.websocket.getDataVectors();

    // this.drawGrid();
    // this.drawAxes();
    this.drawDataVectorsSVG();
    window.requestAnimationFrame(this.draw.bind(this));
}

WosciSVGPlotter.prototype.drawDataVectorsSVG = function() {
    if (!("vectorCount" in this.data && "vectors" in this.data)) {
        return;
    }
    let vectorCount = this.data.vectorCount;
    let vectors = this.data.vectors;

    let viewBox = Wosci.ui.elSVGPlotter.getAttribute("viewBox")
                       .split(" ")
                       .map(x => parseFloat(x));
    let pixelsX = viewBox[2] - viewBox[0];
    let pixelsY = viewBox[3] - viewBox[1];
    let yLimMin = Wosci.ui.getYLimits()[0];
    let yLimMax = Wosci.ui.getYLimits()[1];
    let yLimDelta = yLimMax - yLimMin;

    for(let vectorIndex = 0; vectorIndex < vectorCount; vectorIndex++) {
        let length = vectors[vectorIndex].length;
        let values = vectors[vectorIndex].values;
        let deltaX = pixelsX / (length-1);
        let points = []
        for(let i = 0; i < length; i++) {
            let y = Math.round(( pixelsY - (values[i] - yLimMin) / yLimDelta * pixelsY));
            let x = Math.round(i * deltaX)
            points.push([x, y]);
        }
        let path = "M" + points.map(p => p[0]+","+p[1]).join(" L");
        /* TODO: generalize path handling */
        let elPath = document.getElementById(`svg-path-${vectorIndex+1}`)
        elPath.setAttribute("d", path)
        elPath.setAttribute("style", "stroke: "+Wosci.settings.dataLineColor[vectorIndex]+";");
    }
}

WosciSVGPlotter.prototype.drawGrid = function() {
    // let N_x = this.cvs.width;
    // let N_y = this.cvs.height;
    // let ctx = this.ctx;

    // ctx.beginPath();
    // ctx.strokeStyle = this.settings.gridColor;
    // ctx.setLineDash(this.settings.gridLineDash);

    // delta_grid_x = Math.round(N_x/10);
    // delta_grid_y = Math.round(N_y/10);
    // for(var i = 1; i < 10; i++) {
    //     ctx.moveTo(i*delta_grid_x, 0);
    //     ctx.lineTo(i*delta_grid_x, N_y);
    //     ctx.moveTo(0, i*delta_grid_y);
    //     ctx.lineTo(N_x, i*delta_grid_y);
    // }
    // ctx.stroke();
}

WosciSVGPlotter.prototype.drawAxes = function() {
    // var ctx = this.ctx;
    // N_x = this.N_x;
    // N_y = this.N_y;
    // yLimMax = this.yLimMax;
    // yLimMin = this.yLimMin
    // yLimHalf = (yLimMax-yLimMin)/2 + this.settings.yLimMin;
    // ctx.font="12px Arial";
    // ctx.fillStyle = this.settings.gridColor;
    // ctx.fillText(`${yLimMax}`, 2, 12);
    // ctx.fillText(`${yLimMin}`, 2, N_y-2);
    // ctx.fillText(`${yLimHalf}`, 2, N_y/2 - 5);
}

/******************************************************************************
 * Wosci Main class (singleton)
 */
var Wosci = {
    init: function() {
        this.websocket = new WosciWebSocket();
        this.ui = new WosciUI();
        this.SVGPlotter = new WosciSVGPlotter();
        this.settings = new WosciSettings();
        
        /* Start plotting */
        this.SVGPlotter.draw();
    }
};

/* Start Wosci */
Wosci.init();
