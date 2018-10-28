import socket
import time
import sys
import threading

def get_ip(dns="1.1.1.1", port=80):
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s: 
            s.connect((dns, port))
            ip = s.getsockname()[0]
    except:
        ip = "127.0.0.1"
        print("warning: Could not get correct IP. Set to " + ip)
    return ip

ip_dest = "192.168.1.80"
ip_local = get_ip()
port = 5005

sock_send =  socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
sock_recv =  socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
sock_recv.bind((ip_local, port))
print("Bind receiver to: " + ip_local + ":" + str(port))

def send_data(data):
    data_str = str(data) + "\n"
    message = data_str.encode('UTF-8')
    sock_send.sendto(message, (ip_dest, port))

def data_producer(event):
    print("Started data producer thread.")
    data = 0
    while True:
        if event.is_set():
            data = data + 1
            send_data(data)
        time.sleep(.1)

def data_consumer(event):
    print("Started consumer thread.")
    while True:
        data = ""
        data, addr = sock_recv.recvfrom(1024)
        received_str = data.decode('UTF-8')
        print(received_str)
        if "start" in received_str.lower():
            event.set()
            print("data producer started")
        elif "stop" in received_str.lower():
            event.clear()
            print("data producer stopped")


if __name__ == "__main__":
    event = threading.Event()
    t_producer = threading.Thread(name='data_producer', target=data_producer, args=(event,))
    t_consumer = threading.Thread(name='data_consumer', target=data_consumer, args=(event,))
    t_producer.daemon = True
    t_consumer.daemon = True
    t_producer.start()
    t_consumer.start()
    event.set()
    while True:
        try:
            time.sleep(1)
        except:
            break
    print("Closing connection.")
    sock_send.close()
    sock_recv.close()
    