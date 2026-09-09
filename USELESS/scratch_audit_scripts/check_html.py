import urllib.request
import re

html = urllib.request.urlopen('http://localhost:3000/dashboard').read().decode('utf-8')
print(f"HTML size: {len(html)} bytes")

# Check for presence of tags
keywords = [
    'APPROVED FOR DISPATCH',
    'ROUTE ADVISORY',
    'SERVICE HOLD',
    'Powertrain Diagnostic',
    'AI Powertrain',
    'Euler HiLoad',
    'Tata Ace'
]

for kw in keywords:
    count = len(re.findall(re.escape(kw), html, re.IGNORECASE))
    print(f"Keyword '{kw}': {count} occurrences")
