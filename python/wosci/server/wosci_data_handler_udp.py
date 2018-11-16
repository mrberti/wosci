import logging
import socket

from .. import utils

class WosciDataHandlerUDP():
    def __init__(self):
        self.sock_receiver = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self.sock_sender = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

    def start(self, localHost, localPort=5006):
        logging.info("Bind to: " + localHost + ":" + str(localPort))
        self.sock_receiver.bind((localHost, localPort))
    
    def close(self):
        self.sock_receiver.close()
    
    def get_data(self, size=1024):
        self.sock_receiver.settimeout(1)
        data, addr = self.sock_receiver.recvfrom(size)
        return data

    def send_data(self, data, destHost="127.0.0.1", destPort=5005):
        data_str = str(data) + "\n"
        message = data_str.encode('UTF-8')
        self.sock_sender.sendto(message, (destHost, destPort))

def wosci_data_handler_udp():
    logging.basicConfig(
        format='%(asctime)s <%(levelname)s> %(message)s', 
        level=logging.DEBUG,
    )
    local_host = utils.get_local_ip()
    local_port = 5006
    data_handler = WosciDataHandlerUDP()
    data_handler.start(local_host, local_port)
    data_handler.send_data("*IDN?", local_host)

    try:
        while True:
            data = data_handler.get_data()
            print(str(data))
    except KeyboardInterrupt:
        pass
    finally:
        data_handler.send_data("stop", local_host)
        data_handler.close()
        logging.info("Connection closed.")
