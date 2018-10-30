var Wosci = {
    settings: {
        canvasId: "wosci_canvas",
        backgroundColor: "#111",
        borderColor: "#333",
        gridColor: "#444",
        gridLineDash: [2, 3],
        dataLineColor: ["#0066ff", "#990000",],
        //dataLineDash: [[1, 0],]
    },

    init: function() {
        this.cvs = document.getElementById(this.settings.canvasId);
        this.ctx = Wosci.cvs.getContext("2d");
        this.N_x = this.cvs.width;
        this.N_y = this.cvs.height;
    },

    decodeMessage: function(event) {
        var ctx = this.ctx;
        p = document.getElementById("p1");
        p.innerHTML = event.data;
        packet = JSON.parse(event.data);

        this.data = packet["data"];
        this.data_length = packet["data_length"];
        this.draw();
    },

    connect: function() {
        /* Check if the websocket is already up an running */
        if(this.websocket) {
            if(this.websocket.readyState == 1) {
                console.log("Websocket already running.");
                return;
            }
        }
        /* Create a new websocket object and define callbacks */
        this.websocket = new WebSocket("ws://127.0.0.1:5678/");
        console.log("New Websocket created.");
        var self = this;
        this.websocket.onmessage = function(e) {
            self.decodeMessage(e);
        };
        this.websocket.onerror = function(e) {
            p.innerHTML = JSON.stringify(e);
        };
        this.websocket.onclose = function (e) {
            console.log("Websocket Closed.");
            p = document.getElementById("p1");
            p.innerHTML = "Connection Closed";
            alert("Connection Closed");
        }
        console.log("Websocket callbacks connected.");
        console.log(this.websocket);
    },

    close: function() {
        try { 
            this.websocket.close();
        }
        catch {
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

    drawData: function() {
        var data_length = this.data_length;
        if(!data_length)
            return;
        var data = this.data;
        var N_y = this.N_y;
        var N_x = this.N_x;
        var delta_x = Math.round(N_x/data_length);
        this.ctx.beginPath();
        this.ctx.strokeStyle = this.settings.dataLineColor[0];
        this.ctx.setLineDash([]);
        for(var x = 0; x < N_x; x += 1) {
            this.ctx.lineTo(x*delta_x, N_y - Math.round(N_y*data[x]/1024));
        }
        this.ctx.stroke();
    },

    draw: function() {
        var N_x = this.N_x;
        var N_y = this.N_y;
        this.ctx.clearRect(0, 0, N_x, N_y);
        this.drawGrid();
        this.drawAxes();
        this.drawData();
    },
};

/*
 * Main handling
 */
document.getElementById("btnClose").onclick = function(e) {
    Wosci.close();
}

document.getElementById("btnConnect").onclick = function(e) {
    Wosci.connect();
}

Wosci.init();
console.log(JSON.stringify(Wosci));
