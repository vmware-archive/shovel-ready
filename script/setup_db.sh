#!/usr/bin/env sh

mysql --user="root" --password="password" --execute="DROP DATABASE shovel_ready; CREATE DATABASE shovel_ready;"
mysql --user="root" --password="password" shovel_ready < db/schema.sql
