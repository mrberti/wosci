const SerialPort = require("serialport");
const Readline = require("@serialport/parser-readline");

module.exports = {
    openSerialPort: openSerialPort,
    getPacket: getPacket,
}

let serialPort = null;
let vals = [];

let dataVectors = {
    "label": "label",
    "unit": "unit",
    "length": 0,
    "values": vals,
}

let packet = {
    "packetType": "dataVectors",
    "dataVectorsCount": 1,
    "dataVectors": [dataVectors]
}

function openSerialPort(port, baudrate, options = {} ) {
    serialPort = new SerialPort(port, {
        baudRate: baudrate,
        // xon: true,
        // xoff: true,
        // xany: true,
        // rtscts: true,
        // autoOpen: false,
    });

    const parser = serialPort.pipe(new Readline());

    // serialPort.open();
    serialPort.on("open", () => {
        console.log("opened");
    });

    parser.on("data", (data) => {
        // console.log("Received: " + data.toString());
        let val = parseInt(data.toString());
        if (vals.length > 2000) {
            vals.shift();
        }
        vals.push(val);
        // console.log(val);
        packet.dataVectors[0].length = vals.length;
    });
}

function getPacket() {

    return packet;
}

// Test module
if(require.main === module) {
    openSerialPort("COM7", 500000);
    setTimeout(()=>{
        console.log(JSON.stringify(getPacket()))
    }, 2000)
}
