#!/usr/bin/env bash
set -o errexit

if [ -d "backend" ]; then
  cd backend
fi

pip install --upgrade pip
pip install -r requirements.txt
python manage.py collectstatic --noinput
python manage.py migrate
