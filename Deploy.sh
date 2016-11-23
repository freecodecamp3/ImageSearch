#!/bin/bash

cd `dirname $0`
pwd

git add .
git commit -m 'commit'
git push heroku master
git push origin master
heroku open