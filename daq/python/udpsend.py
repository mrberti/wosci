import socket
import sys

message = sys.argv[1]

ip = "192.168.1.40"
port = 5005

sock =  socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
print(message)
sock.sendto(message.encode('UTF-8'), (ip,port))