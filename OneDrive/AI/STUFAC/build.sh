#!/usr/bin/env bash
set -o errexit

if [ -d "student-dashboard/backend" ]; then
  cd student-dashboard/backend
fi

pip install --upgrade pip
pip install -r requirements.txt
python manage.py collectstatic --noinput
python manage.py migrate
