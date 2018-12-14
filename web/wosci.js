"use strict";

var Wosci = {
    settings: {
        canvasID: "wosci_canvas",
        SVGPlotterID: "svg-plotter",

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

        /* Server settings */
        remoteAddress: "192.168.1.40",
        remotePort: 5679,
        serverString: function() {
            return "ws://"+this.remoteAddress+":"+this.remotePort+"/";
        }
    },

    init: function() {
        this.cvs = document.getElementById(this.settings.canvasID);
        this.ctx = Wosci.cvs.getContext("2d");
        /* Plot settings*/
        this.elYLimMin = document.getElementById("edYMin")
        this.elYLimMax = document.getElementById("edYMax")

        /* SVG */
        this.elSVGPlotter = document.getElementById(this.settings.SVGPlotterID);

        /* Initialize data*/
        this.data = {};
        this.draw();

        // requestAnimationFrame(()=>this.draw);
    },

    messageHandler: function(event) {
        let p = document.getElementById("p1");
        p.innerHTML = event.data;
        let packet = JSON.parse(event.data);

        let message_type = packet["message_type"];
        if(message_type == "data_vectors") {
            let data = {};
            data.vectorCount =  parseInt(packet["data_vectors_count"]);
            data.vectors = packet["data_vectors"];
            this.data = data;
            // this.draw();
        }
    },

    connectWebsocket: function() {
        /* Check if the websocket is already up an running */
        if(this.websocket) {
            if(this.websocket.readyState == 1) {
                console.log("Websocket already running.");
                return;
            }
        }
        /* Create a new websocket object and define callbacks */
        let serverString = this.settings.serverString();
        this.websocket = new WebSocket(serverString);
        console.log("New Websocket created to " + serverString);
        let self = this;
        let p = document.getElementById("p1");
        this.websocket.onmessage = function(e) {
            self.messageHandler(e);
        };
        this.websocket.onerror = function(e) {
            p.innerHTML = JSON.stringify(e);
        };
        this.websocket.onclose = function (e) {
            console.log("Websocket Closed.");
            p.innerHTML = "Connection Closed";
        }
    },

    close: function() {
        try { 
            this.websocket.close();
        }
        catch(error) {
            console.log("Could not close websocket.");
            return;
        }
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
        // this.ctx.clearRect(0, 0, this.N_x, this.N_y);
        // this.drawGrid();
        // this.drawAxes();
        // this.drawDataVectors(data.vectorCount, data.vectors);
        this.drawDataVectorsSVG();
        window.requestAnimationFrame(this.draw.bind(this));
    },
};

function removeMessage(li) {
    var ul = document.getElementById("message-list");
    ul.removeChild(li)
}

function displayMessage(type, message) {
    var ul = document.getElementById("message-list");
    var li = document.createElement("li");
    li.className = type;
    li.onclick = function() { removeMessage(li); };
    li.appendChild(document.createTextNode(message));
    ul.prepend(li);
    setTimeout(function() {removeMessage(li)}, 5000);
}

document.getElementById("btnClose").onclick = function(e) {
    Wosci.close();
    displayMessage("warning", "Connection closed");
}

document.getElementById("btnConnect").onclick = function(e) {
    var remoteAddress = document.getElementById("edRemoteAddress").value;
    var remotePort = document.getElementById("edRemotePort").value;
    Wosci.settings.remoteAddress = remoteAddress;
    Wosci.settings.remotePort = remotePort;
    Wosci.connectWebsocket();
    displayMessage("info", "Connected");
}

// document.getElementById("edYMax").onchange = function(e) {
//     Wosci.yLimMax = parseFloat(document.getElementById("edYMax").value);
// }

// document.getElementById("edYMin").onchange = function(e) {
//     Wosci.yLimMin = parseFloat(document.getElementById("edYMin").value);
// }

document.getElementById("logo").onclick = function(e) {
    document.getElementById("sidebar").classList.toggle("hidden");
    displayMessage("warning", "This is an error message",);
}

/* Start Wosci */
Wosci.init();
console.log(Wosci);
