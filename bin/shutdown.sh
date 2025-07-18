#!/bin/bash                                                                     

LOCK=./lock

if [ `whoami` != 'root' ]; then
    echo 'I am not a root.'
    exit;
fi

if ! [ -e $LOCK ]; then
	echo "already stopped.";
	exit;
else
	rm lock;
fi

kill `ps -ef | grep node | grep -v grep | awk '{print $2}'`
kill `ps -ef | grep grunt | grep -v grep | awk '{print $2}'`


