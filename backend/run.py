import os
import sys
from pathlib import Path

# Automatically add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

import uvicorn

if __name__ == "__main__":
    port = int(os.getenv("PORT", "8001"))
    print("=" * 65)
    print("  ApexAgile Pro - Enterprise Agile Project Management")
    print(f"  Server starting on:        http://127.0.0.1:{port}")
    print(f"  Interactive Swagger Docs:  http://127.0.0.1:{port}/docs")
    print(f"  Interactive ReDoc:         http://127.0.0.1:{port}/redoc")
    print("=" * 65)
    uvicorn.run("app.main:app", host="127.0.0.1", port=port, reload=True)
