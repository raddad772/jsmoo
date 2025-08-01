#!/usr/bin/env python3

# Simple Python file to serve files to a local JS page. SUPER INSECURE and a lot of other stuff, NEVER USE except for personal use!
# Plop this down in whatever directory you want to serve, for example, ROMs from.

from http.server import HTTPServer, SimpleHTTPRequestHandler, test
import sys


class CORSRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        '''
        Cross-Origin-Embedder-Policy: require-corp
        Cross-Origin-Opener-Policy: same-origin'''
        self.send_header('Cross-Origin-Embedder-Policy', 'require-corp')
        self.send_header('Cross-Origin-Opener-Policy', 'same-origin')
        SimpleHTTPRequestHandler.end_headers(self)


if __name__ == '__main__':
    test(CORSRequestHandler, HTTPServer, port=int(sys.argv[1]) if len(sys.argv) > 1 else 8000)
