from setuptools import setup

def readme():
    with open('README.md') as f:
        return f.read()

setup(
    name='wosci',
    version='0.0.0',
    author='Simon Bertling',
    author_email='simon.bertling@gmx.de',
    description='A playground for a websocket based oscilloscope',
    long_description=readme(),
    long_description_content_type="text/markdown",
    url='https://github.com/mrberti/wosci',
    license='MIT',
    packages=['wosci'],
)
