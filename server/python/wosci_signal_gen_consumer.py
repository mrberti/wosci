import socket

def get_ip(dns="1.1.1.1", port=80):
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s: 
            s.connect((dns, port))
            ip = s.getsockname()[0]
    except:
        ip = "127.0.0.1"
        print("warning: Could not get correct IP. Set to " + ip)
    return ip

udp_ip = get_ip()
udp_port = 5005

try:
    with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
        print("Bind to: " + udp_ip + ":" + str(udp_port))
        sock.bind((udp_ip, udp_port))
        print("Starting consumer...")

        while True:
            data, addr = sock.recvfrom(1024)
            print(str(int(data)))
except KeyboardInterrupt:
    pass
finally:
    print("Connection closed.")