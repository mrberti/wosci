var Wosci = {
    settings: {
        canvasId: "wosci_canvas",
        backgroundColor: "#111",
        borderColor: "#333",
        gridColor: "#444",
        gridLineDash: [2, 3],
        dataLineColor: ["#0066ff", "#ff4400","#ffcc00","#009900","#cc00ff","#00b8e6","#e6005c","#d9d9d9", "#00cc00", "#ff8000"],
        remoteAddress: "192.168.1.40",
        remotePort: 5678,
        serverString: function() {
            return "ws://"+this.remoteAddress+":"+this.remotePort+"/";
        }
    },

    init: function() {
        this.cvs = document.getElementById(this.settings.canvasId);
        this.ctx = Wosci.cvs.getContext("2d");
        this.N_x = this.cvs.width;
        this.N_y = this.cvs.height;
    },

    messageHandler: function(event) {
        p = document.getElementById("p1");
        p.innerHTML = event.data;
        packet = JSON.parse(event.data);

        message_type = packet["message_type"];
        if(message_type == "data_vectors") {
            data = {};
            data.vectorCount =  parseInt(packet["data_vectors_count"]);
            data.vectors = packet["data_vectors"];
            this.draw(data);
        }
    },

    connectServer: function() {
        /* Check if the websocket is already up an running */
        if(this.websocket) {
            if(this.websocket.readyState == 1) {
                console.log("Websocket already running.");
                return;
            }
        }
        /* Create a new websocket object and define callbacks */
        serverString = this.settings.serverString();
        this.websocket = new WebSocket(serverString);
        console.log("New Websocket created to " + serverString);
        var self = this;
        p = document.getElementById("p1");
        this.websocket.onmessage = function(e) {
            self.messageHandler(e);
        };
        this.websocket.onerror = function(e) {
            p.innerHTML = JSON.stringify(e);
        };
        this.websocket.onclose = function (e) {
            console.log("Websocket Closed.");
            p.innerHTML = "Connection Closed";
            alert("Connection Closed");
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
        N_x = this.N_x;
        N_y = this.N_y;
        ctx = this.ctx;

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
    },

    drawDataVectors: function(vectorCount, vectors) {
        var length, values;
        var delta_x;
        var N_y = this.N_y;
        var N_x = this.N_x;

        for(var i_vec = 0; i_vec < vectorCount; i_vec++) {
            length = vectors[i_vec]["length"];
            values = vectors[i_vec]["values"];
            //delta_x = Math.round(N_x / length);
            delta_x = N_x / (length-1);
            console.log(delta_x);
            this.ctx.beginPath();
            this.ctx.strokeStyle = this.settings.dataLineColor[i_vec];
            this.ctx.setLineDash([]);
            for(var x = 0; x < length; x += 1) {
                this.ctx.lineTo(Math.round(x * delta_x), N_y - Math.round(N_y * values[x] / 1024));
            }
            this.ctx.stroke();
        }
    },

    draw: function(data) {
        var N_x = this.N_x;
        var N_y = this.N_y;
        this.ctx.clearRect(0, 0, N_x, N_y);
        this.drawGrid();
        this.drawAxes();
        this.drawDataVectors(data.vectorCount, data.vectors);
    },
};

/*
 * Main handling
 */
document.getElementById("btnClose").onclick = function(e) {
    Wosci.close();
}

document.getElementById("btnConnect").onclick = function(e) {
    var remoteAddress = document.getElementById("edRemoteAddress").value;
    Wosci.settings.remoteAddress = remoteAddress;
    Wosci.connectServer();
}

Wosci.init();
console.log(JSON.stringify(Wosci));
