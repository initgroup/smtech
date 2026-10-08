# -*- coding: utf-8 -*-
"""Current developer delta entrypoint. Legacy full-project delta is archived separately."""
from pathlib import Path
import runpy
if __name__ == '__main__':
    runpy.run_path(str(Path(__file__).parent / 'delivery' / 'delivery_delta.py'), run_name='__main__')
