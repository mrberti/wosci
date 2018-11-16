import random
import time

def ran_gen(delay):
    time.sleep(delay)
    ret = random.randint(0,100)
    yield ret

#while True:
print(str(ran_gen(.1)))
print(str(random.randint(1,2)))
