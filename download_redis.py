import urllib.request
import zipfile
import os
import ssl

print("Downloading Redis for Windows...")
url = "https://github.com/microsoftarchive/redis/releases/download/win-3.0.504/Redis-x64-3.0.504.zip"

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

with urllib.request.urlopen(url, context=ctx) as response, open("redis.zip", 'wb') as out_file:
    data = response.read()
    out_file.write(data)

print("Download complete. Extracting...")

with zipfile.ZipFile("redis.zip", 'r') as zip_ref:
    zip_ref.extractall("redis")

print("Extraction complete! Starting Redis server in background...")
os.remove("redis.zip")
