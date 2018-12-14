"use strict";

/******************************************************************************
 * WosciWebSocket
 */
function WosciWebSocket() {
    this.webSocket = null;
    this.dataVectors = {};
    this.ui = new WosciUI;
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
            this.ui.showMessage("Websocket already running.", "warning")
            return;
        }
    }
    /* Create a new websocket object */
    let serverString = "ws://"+remoteAddress+":"+remotePort+"/";;
    this.webSocket = new WebSocket(serverString);
    this.ui.showMessage("New WebSocket created: " + serverString)
    console.log("New Websocket created: " + serverString);

    /* Define Websocket callbacks */
    let self = this;
    let p = document.getElementById("p1");
    this.webSocket.onmessage = function(event) {
        self.messageHandler(event);
    };
    this.webSocket.onerror = function(event) {
        self.ui.showMessage("WebSocket: A wild error appeared", "error");
        this.WebSocket.close();
        console.log(event);
        p.innerHTML = JSON.stringify(event);
    };
    this.webSocket.onclose = function (event) {
        self.ui.showMessage("The WebSocket was closed", "info");
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
 * WosciUI
 */
function WosciUI() {
    this.elBtnConnect = document.getElementById("btnConnect");
    this.elBtnClose = document.getElementById("btnClose");
    this.elEdRemoteAddress = document.getElementById("edRemoteAddress");
    this.elEdRemotePort = document.getElementById("edRemotePort");
    this.elYLimMin = document.getElementById("edYLimMin");
    this.elYLimMin = document.getElementById("edYLimMin");
    this.elMessageList = document.getElementById("message-list");
    this.elLogo = document.getElementById("logo");
    this.elSidebar = document.getElementById("sidebar");

    /* Assign callbacks on button clicks */
    var self = this;
    this.elLogo.onclick = function() {
        self.elSidebar.classList.toggle("hidden");
    }

    this.elBtnClose.onclick = function() {
        Wosci.wosciWebsocket.close();
    }

    this.elBtnConnect.onclick = function() {
        var remoteAddress = self.elEdRemoteAddress.value;
        var remotePort = self.elEdRemotePort.value;
        Wosci.settings.remoteAddress = remoteAddress;
        Wosci.settings.remotePort = remotePort;
        Wosci.wosciWebsocket.connect(remoteAddress, remotePort);
    }
}

WosciUI.prototype.getYLimits = function() {
    return [0, 100];
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
 * 
 */
var Wosci = {
    settings: {
        canvasID: "wosci_canvas",
        SVGPlotterID: "svg-plotter",
        yLimMinID: "edYMin",
        yLimMaxID: "edYMax",

        /* Style settings */
        backgroundColor: "#111",
        borderColor: "#333",
        gridColor: "#444",
        gridLineDash: [2, 3],
        dataLineColor: [
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
        ],
    },

    init: function() {
        /* Create Wosci Websocket */
        this.wosciWebsocket = new WosciWebSocket();

        /* Plot settings*/
        this.elYLimMin = document.getElementById(this.settings.yLimMinID)
        this.elYLimMax = document.getElementById(this.settings.yLimMaxID)

        /* canvas */
        this.cvs = document.getElementById(this.settings.canvasID);
        this.ctx = Wosci.cvs.getContext("2d");

        /* SVG */
        this.elSVGPlotter = document.getElementById(this.settings.SVGPlotterID);

        /* Initialize data*/
        this.data = {};
    },

    drawGrid: function() {
        let N_x = this.cvs.width;
        let N_y = this.cvs.height;
        let ctx = this.ctx;

        ctx.beginPath();
        ctx.strokeStyle = this.settings.gridColor;
        ctx.setLineDash(this.settings.gridLineDash);

        delta_grid_x = Math.round(N_x/10);
        delta_grid_y = Math.round(N_y/10);
        for(var i = 1; i < 10; i++) {
            ctx.moveTo(i*delta_grid_x, 0);
            ctx.lineTo(i*delta_grid_x, N_y);
            ctx.moveTo(0, i*delta_grid_y);
            ctx.lineTo(N_x, i*delta_grid_y);
        }
        ctx.stroke();
    },

    drawAxes: function() {
        var ctx = this.ctx;
        N_x = this.N_x;
        N_y = this.N_y;
        yLimMax = this.yLimMax;
        yLimMin = this.yLimMin
        yLimHalf = (yLimMax-yLimMin)/2 + this.settings.yLimMin;
        ctx.font="12px Arial";
        ctx.fillStyle = this.settings.gridColor;
        ctx.fillText(`${yLimMax}`, 2, 12);
        ctx.fillText(`${yLimMin}`, 2, N_y-2);
        ctx.fillText(`${yLimHalf}`, 2, N_y/2 - 5);
    },

    drawDataVectors: function(vectorCount, vectors) {
        var length, values;
        var delta_x;
        var N_x = this.N_x;
        var N_y = this.N_y;
        let yLimMin = parseFloat(this.elYLimMin.value);
        let yLimMax = parseFloat(this.elYLimMax.value);
        var yLimDelta = yLimMax - yLimMin;

        for(var i_vec = 0; i_vec < vectorCount; i_vec++) {
            length = vectors[i_vec]["length"];
            values = vectors[i_vec]["values"];
            delta_x = N_x / (length-1);
            this.ctx.beginPath();
            this.ctx.strokeStyle = this.settings.dataLineColor[i_vec];
            this.ctx.setLineDash([]);
            for(var x = 0; x < length; x += 1) {
                y = Math.round((values[x]-yLimMin) / yLimDelta * N_y)
                this.ctx.lineTo(Math.round(x * delta_x), N_y - y);
            }
            this.ctx.stroke();
        }
    },

    drawDataVectorsSVG: function() {
        if (!("vectorCount" in this.data && "vectors" in this.data)) {
            return;
        }
        let vectorCount = this.data.vectorCount;
        let vectors = this.data.vectors;

        let elSVG = document.getElementById("svg-plotter");
        let viewBox = elSVG.getAttribute("viewBox")
                           .split(" ")
                           .map(x => parseFloat(x));
        let N_x = viewBox[2] - viewBox[0];
        let N_y = viewBox[3] - viewBox[1];
        // let N_x = 750;
        // let N_y = 500;
        let yLimMin = parseFloat(this.elYLimMin.value);
        let yLimMax = parseFloat(this.elYLimMax.value);
        let yLimDelta = yLimMax - yLimMin;

        for(let i_vec = 0; i_vec < vectorCount; i_vec++) {
            let length = vectors[i_vec].length;
            let values = vectors[i_vec].values;
            let delta_x = N_x / (length-1);
            let points = []
            for(let i = 0; i < length; i++) {
                let y = Math.round(( N_y - (values[i]-yLimMin) / yLimDelta * N_y));
                let x = Math.round(i*delta_x)
                // let y = ((yLimDelta / values[i] * N_y - yLimMin));
                // let x = (i*delta_x)
                points.push([x, y]);
            }
            let path = "M" + points.map(p => p[0]+","+p[1]).join(" L");
            let elPath = document.getElementById(`svg-path-${i_vec+1}`)
            elPath.setAttribute("d", path)
            elPath.setAttribute("style", "stroke: "+this.settings.dataLineColor[i_vec]+";");
        }
    },

    draw: function() {
        this.data = this.wosciWebsocket.getDataVectors();
        // this.ctx.clearRect(0, 0, this.N_x, this.N_y);
        // this.drawGrid();
        // this.drawAxes();
        // this.drawDataVectors(data.vectorCount, data.vectors);
        this.drawDataVectorsSVG();
        window.requestAnimationFrame(this.draw.bind(this));
    },
};

/* Start Wosci */
Wosci.init();
Wosci.draw();
