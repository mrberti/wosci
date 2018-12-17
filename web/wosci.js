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
    this.elYLimMin = document.getElementById("edYLimMinCh1");
    this.elYLimMax = document.getElementById("edYLimMaxCh1");
    this.elEnableGrid = document.getElementById("cbEnableGrid");
    this.elMessageList = document.getElementById("message-list");
    this.elLogo = document.getElementById("logo");
    this.elSidebar = document.getElementById("sidebar");
    this.elSVGPlotter = document.getElementById("svg-plotter");
    this.canvas = document.getElementById("wosci_canvas");
    this.context = this.canvas.getContext("2d");

    /* Axes control */
    this.elNumAxes = document.getElementById("edNumAxes");

    /* svg plotter */
    this.elPlotterMain = document.getElementById("plotter-main");
    this.elSVGTraces = document.getElementById("svg-plotter-traces")
    this.elSVGPaths = this.elSVGTraces.querySelectorAll("path");

    /* Y-scales */
    this.elPlotterColContainer = document.getElementById("plotter-col-container");

    /* When logo clicked => toggle sidebar */
    this.elLogo.onclick = function() {
        this.elSidebar.classList.toggle("hidden");
    }.bind(this);

    /* When closed clicked => close websocket */
    this.elBtnClose.onclick = function() {
        Wosci.websocket.close();
    };

    /* When connect clicked => open websocket */
    this.elBtnConnect.onclick = function() {
        var remoteAddress = this.elEdRemoteAddress.value;
        var remotePort = this.elEdRemotePort.value;
        Wosci.settings.remoteAddress = remoteAddress;
        Wosci.settings.remotePort = remotePort;
        Wosci.websocket.connect(remoteAddress, remotePort);
    }.bind(this);

    /* When Scale Y clicked => hide*/
    this.addEventsScaleYClicked();

    /* Number of axes has been changed => add or remove axes */
    this.numAxes = 1;
    this.elNumAxes.value = this.numAxes;
    this.elNumAxes.onchange = function() {
        let newNumAxes = this.elNumAxes.value;
        while (this.numAxes != newNumAxes) {
            if (newNumAxes > this.numAxes) {
                this.numAxes++;
                this.addAxis(this.numAxes);
            }
            else if (newNumAxes < this.numAxes) {
                this.removeAxis(this.numAxes);
                this.numAxes--;
            }
        }
    }.bind(this);

    /* 
    !!DANGER AREA! KEEP OUT!!
    */
    /* Test: scroll y scales */
    this.elPlotterColContainer.childNodes[1].onwheel = function(event) {
        // console.log(event.deltaY);
        event.preventDefault();
        let elMax = document.getElementById("edYLimMaxCh1");
        let elMin = document.getElementById("edYLimMinCh1");
        elMax.value *= (event.deltaY > 1 ? 1.1 : 0.9).toPrecision(4);
        elMin.value *= (event.deltaY > 1 ? 1.1 : 0.9).toPrecision(4);
    }

    this.elPlotterColContainer.childNodes[1].ondblclick = function(event) {
        // console.log(event.deltaY);
        event.preventDefault();
        let elMax = document.getElementById("edYLimMaxCh1");
        let elMin = document.getElementById("edYLimMinCh1");
        let max = Math.max.apply(null, Wosci.websocket.getDataVectors().vectors[0].values);
        let min = Math.min.apply(null, Wosci.websocket.getDataVectors().vectors[0].values);
        elMin.value = min;
        elMax.value = max;
    }

    this.elPlotterColContainer.childNodes[1].onmousedown= function(event) {
        // console.log(event);
        // let startX = event.clientX;
        let startY = event.clientY;
        let elMax = document.getElementById("edYLimMaxCh1");
        let elMin = document.getElementById("edYLimMinCh1");
        let startMax = elMax.value;
        let startMin = elMin.value;
        let yLims = this.getYLimits(1);
        let pixelsY = this.getPlotterBBox().height;
        let yLimDiff = yLims[1] - yLims[0];
        let scale = yLimDiff/pixelsY;
        // console.log(scale);
        document.body.style.cursor = "n-resize";

        document.onmousemove = function(event2) {
            // console.log(event2);
            // event2.preventDefault();
            let dY = Math.round((startY-event2.clientY)*scale);
            // console.log(dY);
            elMax.value = startMax - dY;
            elMin.value = startMin - dY;
            // console.log(elMax.value);
            // elMin.value *= event.deltaY > 1 ? 1.1 : .9;
        }
    }.bind(this);

    document.onmouseup = function() {
        document.onmousemove = function() {
            document.body.style.cursor = "default";
            return false;
        }
    }.bind(this);
}

WosciUI.prototype.addEventsScaleYClicked = function() {
    let els = document.querySelectorAll(".scale-y-click");
    els.forEach(el => {
        el.onclick = function() {
            el.parentElement.classList.toggle("hidden");
        }
    });
}

WosciUI.prototype.addAxis = function(channel) {
    /* Add paths */
    var svgNS = "http://www.w3.org/2000/svg";
    let elNewPath = document.createElementNS(svgNS, "path");
    let className = "ch" + channel;
    elNewPath.setAttributeNS(null, "class", className);
    this.elSVGPaths[0].parentElement.appendChild(elNewPath);
    this.elSVGPaths = this.elSVGTraces.querySelectorAll("path")

    /* Adding scales */
    let elFirstScale = this.elPlotterColContainer.childNodes[1];
    let elNewScale = elFirstScale.cloneNode(true);
    elNewScale.className = className;
    elNewScale.querySelectorAll(".y-lim-max")[0].id = "edYLimMaxCh" + channel;
    elNewScale.querySelectorAll(".y-lim-min")[0].id = "edYLimMinCh" + channel;
    this.elPlotterColContainer.insertBefore(elNewScale, this.elPlotterMain);
    this.addEventsScaleYClicked();
}

WosciUI.prototype.removeAxis = function (channel) {
    /* Remove paths */
    this.elSVGPaths.forEach(el => {
        let channelNumber = el.getAttributeNS(null, "class").match(/\d+/);
        if (channelNumber == channel) {
            this.elSVGTraces.removeChild(el);
        }
    });
    this.elSVGPaths = this.elSVGTraces.querySelectorAll("path")

    /* remove scales */
    this.elPlotterColContainer.querySelector(".ch" + channel).remove();
}

WosciUI.prototype.getYLimits = function(channel) {
    let idMax = "edYLimMaxCh" + channel;
    let idMin = "edYLimMinCh" + channel;
    let elYLimMax = document.getElementById(idMax);
    let elYLimMin = document.getElementById(idMin);
    return [elYLimMin.value, elYLimMax.value];
}

WosciUI.prototype.getPlotterBBox = function() {
    return this.elSVGPlotter.getBoundingClientRect();
}

WosciUI.prototype.removeMessage = function (elMessage) {
    this.elMessageList.removeChild(elMessage);
}

WosciUI.prototype.showMessage = function(message, type = "info") {
    var elNewMessage = document.createElement("li");
    elNewMessage.className = type;
    var timeout = setTimeout(function() { 
        this.removeMessage(elNewMessage); 
    }.bind(this), 5000);
    elNewMessage.onclick = function() {
        clearTimeout(timeout);
        this.removeMessage(elNewMessage);
    }.bind(this);
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
    catch (error) {
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
    if (packet["packetType"] == "message") {
        let message = packet["message"];
        Wosci.ui.showMessage(message)
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
    console.log("New Websocket created: " + serverString);

    /* Define Websocket callbacks */
    let p = document.getElementById("p1");
    this.webSocket.onmessage = function(event) {
        this.messageHandler(event);
    }.bind(this);
    this.webSocket.onerror = function(event) {
        Wosci.ui.showMessage("WebSocket: A wild error appeared", "error");
        this.WebSocket.close();
        console.log(event);
        p.innerHTML = JSON.stringify(event);
    }.bind(this);
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
    catch (error) {
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

    let pixelsX = Wosci.ui.getPlotterBBox().width;
    let pixelsY = Wosci.ui.getPlotterBBox().height;

    for(let vectorIndex = 0; vectorIndex < vectorCount; vectorIndex++) {
        if (vectorIndex >= Wosci.ui.numAxes) {
            break;
        }

        let yLimMin = Wosci.ui.getYLimits(vectorIndex + 1)[0];
        let yLimMax = Wosci.ui.getYLimits(vectorIndex + 1)[1];
        let yLimDelta = yLimMax - yLimMin;
    
        if (yLimDelta == 0) { continue; };

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
        /* TODO: why are the paths not updating? */
        Wosci.ui.elSVGPaths[vectorIndex].setAttributeNS(null, "d", path)
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
console.log(Wosci.ui.elSVGPlotter.getBBox().width)