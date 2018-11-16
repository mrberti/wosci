import socket
import sys

try:
    message = sys.argv[1]
except:
    message = "*IDN?\n"

ip = "192.168.1.40"
#ip = "127.0.0.1"
port = 5005

sock =  socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
print(message)
print(repr(message))
print(repr(message.encode('UTF-8')))
sock.sendto(message.encode('UTF-8'), (ip,port))