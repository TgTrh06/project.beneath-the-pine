"""Compatibility entry point; review manifest and durable checkpoint store are now required."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from ml.training.train import main

if __name__ == '__main__':
    main()
