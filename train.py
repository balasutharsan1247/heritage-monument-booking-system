"""
CLI Entrypoint for Model Training.
Runs the complete training and evaluation pipeline for visitor footfall forecasting.
"""

import sys
import os

# Add workspace root to sys.path so ml package can be imported reliably
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from ml.src.train import run_training_pipeline

if __name__ == "__main__":
    config_file = sys.argv[1] if len(sys.argv) > 1 else None
    run_training_pipeline(config_file)
