"""
CLI prediction utility for direct inference without requiring FastAPI server.
"""

import sys
import os
import json

# Ensure project root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from ml.src.service import predict_footfall, PredictionRequest

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"success": False, "message": "Usage: predict_cli.py <monument_id> <target_date> [daily_capacity]"}))
        sys.exit(1)

    monument_id = sys.argv[1]
    target_date = sys.argv[2]
    daily_cap = int(sys.argv[3]) if len(sys.argv) > 3 and sys.argv[3].isdigit() else None

    try:
        req = PredictionRequest(monument_id=monument_id, target_date=target_date, daily_capacity=daily_cap)
        res = predict_footfall(req)
        print(json.dumps(res))
    except Exception as e:
        print(json.dumps({"success": False, "message": str(e)}))
        sys.exit(1)
