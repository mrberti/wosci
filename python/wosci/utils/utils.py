"""Some usuful function which are often used"""

import logging
import socket

def get_local_ip(dns="1.1.1.1", port=80):
    """Try to establish a connection to a DNS server and get the local IP from 
    the socket name.

    Requires python3 to use socket in context with 'with'.
    """
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s: 
            s.connect((dns, port))
            ip = s.getsockname()[0]
    except Exception as e:
        ip = "localhost"
        logging.warning("Could not get the correct IP. Using default: " + ip + 
            ". " + str(e))
    return ip

if __name__ == '__main__':
    print(get_local_ip())
