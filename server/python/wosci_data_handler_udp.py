import logging
logging.basicConfig(format='%(asctime)s <%(levelname)s> %(message)s', level = 
    logging.DEBUG)
import socket

def get_ip(dns="1.1.1.1", port=80):
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        s.connect((dns, port))
        ip = s.getsockname()[0]
    except Exception as e:
        ip = "127.0.0.1"
        logging.warning("Could not get correct IP. Set to " + ip + ". " 
            + str(e))
    finally:
        s.close()
    return ip

class WosciDataHandlerUDP():
    def __init__(self):
        self.sockReceiver = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self.sockSender = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

    def start(self, localHost, localPort=5006):
        logging.info("Bind to: " + localHost + ":" + str(localPort))
        self.sockReceiver.bind((localHost, localPort))
    
    def close(self):
        self.sockReceiver.close()
    
    def getData(self, size=1024):
        self.sockReceiver.settimeout(1)
        data, addr = self.sockReceiver.recvfrom(size)
        return data

    def sendData(self, data, destHost="127.0.0.1", destPort=5005):
        data_str = str(data) + "\n"
        message = data_str.encode('UTF-8')
        self.sockSender.sendto(message, (destHost, destPort))

if __name__ == "__main__":
    localHost = get_ip()
    localPort = 5006
    dataHandler = WosciDataHandlerUDP()
    dataHandler.start(localHost, localPort)
    dataHandler.sendData("*IDN?", localHost)

    try:
        while True:
            data = dataHandler.getData()
            print(str(data))
    except KeyboardInterrupt:
        pass
    finally:
        dataHandler.sendData("stop", localHost)
        dataHandler.close()
        logging.info("Connection closed.")