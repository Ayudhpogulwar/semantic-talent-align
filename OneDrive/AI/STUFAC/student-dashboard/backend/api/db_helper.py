import sys
import os

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(__file__))

from database import db_layer, get_db
