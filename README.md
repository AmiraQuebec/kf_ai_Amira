Knowledge Forum 6
======================

Copyright(c) 2014-2017 Yoshiaki Matsuzawa All rights researved.

Creating Development Environment
--------------------------------

### Prerequisites ###

* MongoDB 3.2

```shell
$ sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv EA312927

# Unbutu 14.04
$ echo "deb http://repo.mongodb.org/apt/ubuntu trusty/mongodb-org/3.2 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.2.list

# Ubuntu 16.04
$ echo "deb http://repo.mongodb.org/apt/ubuntu xenial/mongodb-org/3.2 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.2.list

# both version
$ sudo apt-get update
$ sudo apt-get install -y mongodb-org
```

* Node.js 6.x LTS

note: please use the following way to install node.js into ubuntu  


```shell
$ sudo apt-get install curl
$ curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
$ sudo apt-get install -y nodejs

# Update npm
$ sudo npm install -g npm

# Install build essentials
$ sudo apt-get install -y build-essential

```
* Git

```shell
$ sudo apt-get install -y git
```

### Install ###

1. Install Development Tools (yo, bower, and grunt)
```shell
$ npm install --global yo bower grunt-cli phantomjs-prebuilt
```

2. Download kf6 from git  
```shell
$ git clone https://github.com/matsuzawalab/kf6.git
```

3. Install Server-side Packages
```shell
$ npm install
```

4. Install Client-side Packages  
```shell
$ bower install
```
5. Configure server settings (v6.10+)

  Version 6.10 introduces (temporarily) a settings.js file controlling mandatory and non mandatory settings such as username case sensibility for login. See settings.sample.js for an example file. 

### Run ###

1. run mongodb
```shell
$ sudo service mongod start
```

2. run kf6 server  
```shell
$ grunt serve
```

