import socket
import sys

def udp_send(message, target_host, target_port):
    with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
        message_to_send = message.encode('UTF-8')
        print(repr(message_to_send))
        sock.sendto(message_to_send, (target_host, target_port))

if __name__ == "__main__":
    """To get a new line character from bash use $'foo\n' as argument"""
    try:
        message = str(sys.argv[1])
    except:
        message = "*IDN?\n"

    try:
        target_host = str(sys.argv[2])
    except:
        target_host = "localhost"

    try:
        port = int(sys.argv[3])
    except:
        port = 5005

    udp_send(message, target_host, port)
