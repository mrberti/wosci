/* Create websocket */
var websocket = new WebSocket("ws://127.0.0.1:5678/");
p = document.getElementById("p");
message = JSON.stringify("moinsen");

//websocket.send(message);

var canvas = document.getElementById("canvas")
var context = canvas.getContext("2d")

websocket.onmessage = function (event) {
    /* Data extraction */
    p.innerHTML = event.data;
    packet = JSON.parse(event.data);

    data = packet["data"];
    data_length = packet["data_length"];
    
    if(!data_length)
    {
        console.log("No correct data");
        
        return;
    }				
    
    /* Drawing */
    N_x = canvas.width;
    N_y = canvas.height;
    
    delta_x = Math.round(N_x/data_length);
    
    context.clearRect(0, 0, N_x, N_y);
    
    // Draw grid
    context.beginPath();
    context.strokeStyle = "#444";
    context.setLineDash([2, 3]);

    delta_grid_x = Math.round(N_x/10);
    for(x = 1; x < 10; x++)
    {
        context.moveTo(x*delta_grid_x,0);
        context.lineTo(x*delta_grid_x,N_y);
        
    }
    context.stroke();
    
    delta_grid_y = Math.round(N_y/10);
    for(y = 1; y < 10; y++)
    {
        context.moveTo(0, y*delta_grid_y);
        context.lineTo(N_x, y*delta_grid_y);
        
    }
    context.stroke();
    
    // Draw data
    context.strokeStyle = "#0066ff";
    //context.strokeStyle = "#990000";
    context.setLineDash([]);

    context.beginPath();
    for(var x = 0; x < N_x; x += 1)
    {
        context.lineTo(x*delta_x, N_y - Math.round(N_y*data[x]/1024));
    }
    context.stroke();
    
};

websocket.onerror = function (e) {
    p.innerHTML = JSON.stringify(e);
};

websocket.onclose = function (e) {
    e.reason = "bye";
    p.innerHTML = "Connection Closed";
    alert("Connection Closed");
};

document.getElementById("btnClose").onclick = function(e)
{
    websocket.close();
}