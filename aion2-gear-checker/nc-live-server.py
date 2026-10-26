#!/usr/bin/env python3
"""AION 2 EU read-only API for the public Gear Checker."""
import html
import json
import os
import re
import threading
import time
import urllib.parse
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

HOST = os.getenv("AION_API_HOST", "127.0.0.1")
PORT = int(os.getenv("AION_API_PORT", "8765"))
SITE = "https://aion2.plaync.com/api/character/"
SEARCH = "https://api-search.plaync.com/aion2global/search/v2/character"
ALLOWED_ORIGIN = "https://kai-022.github.io"
LOCK = threading.Lock()
LAST = [0.0]
CACHE = {}
