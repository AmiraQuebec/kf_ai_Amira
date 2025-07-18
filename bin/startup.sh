#!/bin/bash

LOCK=./lock

if [ `whoami` != 'root' ]; then
    echo 'I am not a root.'
    exit;
fi

if [ -e $LOCK ]; then
	echo "already running.";
	exit;
else
	touch lock;
fi

if [ -f Gruntfile.js ]; then
	echo "from dev folder";
	((PORT=8080 ATTACHMENTS_PATH=../attachments grunt serve:dist) >> log.log) 2>> err.log &
else
	echo "from prod folder";
	((PORT=8080 NODE_ENV=production ATTACHMENTS_PATH=../attachments node server/app.js) >> log.log) 2>> err.log &
fi




