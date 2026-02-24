import json, urllib.request

GEMINI_API_KEY = "AIzaSyCNHarKvndm1RJPAcIpquYGIKlqdFLOgP8"
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"

body = json.dumps({"contents": [{"parts": [{"text": "Responda apenas: -23.5180,-46.6947"}]}]}).encode()
req = urllib.request.Request(GEMINI_URL, data=body, headers={"Content-Type": "application/json"})
try:
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = json.loads(resp.read().decode())
        print("SUCESSO:", data["candidates"][0]["content"]["parts"][0]["text"])
except urllib.error.HTTPError as e:
    print("HTTP ERRO:", e.code, e.read().decode())
except Exception as e:
    print("ERRO:", e)
