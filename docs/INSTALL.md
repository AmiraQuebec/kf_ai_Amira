KF6 Install Manual

-Environment
 - Any linux server, (you might be able to use windows server)
 - Currently working on
   - CentOS at Shizuoka server
   - Ubuntu at UofT server

- 0. Prerequisites
 - 0.1 mongod (make it run in default port)
 - 0.2 node.js
  - use version 0.x, not tested for version >=4
 - 0.3 npm  (if you get compile the sourcerom git)
  - update to the latest version
  - % sudo npm install --global npm@latest
 - 0.4 git (if you get the binary/source from git)
 - 0.5 nginx (recommended)

- 1. Important Settings
 - 1.1 Release ports to use -- (generally, kill httpd)
 - 1.2 Adequate firewall setting (open 80, 443, or 8080)
 - 1.3Number of limit file descriptor -- related to the number of simultaneous user 
$ sudo vi /etc/security/limits.conf
root soft nofile 65536
root hard nofile 65536
* soft nofile 65536
* hard nofile 65536

$ ulimit -n (checking)
$ reboot

- 2. Install
 - Recommended location to install is "/opt/kf6"
  - but you can install in any place. (in that case, please rewrite run script which is located at bin/kf6)

 - 2.1 Get the software
  - 2.1 a) From GIT binary
   - git clone https://github.com/matsuzawalab/kf6-release.git
  - 2.1 b) From GIT source
   - git clone https://github.com/matsuzawalab/kf6.git
  - 2.1 c) From Tar/zip
   - extract the directory to /opt/kf6

 - 2.2 Compile the software (Only when you install from GIT source)
  - move KF6_HOME directory
  - % npm install
  - % bower install
  - % grunt

 - 2.3 Install start/stop scripts
  - 2.3.1 Install the script to start/stop kf6 daemon
    - in case of centos<=6, or ubuntu, please make a link to the script
    - % sudo ln -s /opt/kf6/bin/kf6 /etc/init.d/kf6
  - 2.3.2 Organize the runlevel of running kf6
    - 2.3.2 a) in case of centos<=6, use this command
      - %chkconfig --add kf6
      - The default, the command make runlevel of kf6 to 3,4, and 5
    - 2.3.2 b) in case of ubuntu, use this command
      - %sysv-rc-conf

- 3. Start/Stop kf6
  - %service kf6 start
  - %service kf6 stop
  - The server will be launched at 8080 port in default

- 4. Setting nginx
  - Here is an example to connect nginx and kf from port 80 to kf6 runnning at 8080
  - You can set it up for 443 (SSL) to 8080 as well.
server 
{
   
 listen
      80;
   
 server_name
  kf.si.aoyama.ac.jp;

   
 #charset koi8-r;                                                            

   
 #access_log  /var/log/nginx/log/host.access.log  main;                      


   
 location / 
{
            
 #for uploading                                                     

            
 client_max_body_size 
500M;

            
 #for ipaddress for logging                                         

            
 proxy_set_header 
Host $http_host;
            
 proxy_set_header 
X-Real-IP $remote_addr;
            
 proxy_set_header 
X-Forwarded-Proto $scheme;
            
 proxy_set_header 
X-Forwarded-Host $http_host;
            
 proxy_set_header 
X-Forwarded-Server $host;
            
 proxy_set_header 
X-Forwarded-For $proxy_add_x_forwarded_for;

            
 #for socket.io                                                     

            
 proxy_http_version 
1.1;
            
 proxy_set_header 
Upgrade $http_upgrade;
            
 proxy_set_header Connection "upgrade"
;

            
 proxy_pass http://kf.si.aoyama.ac.jp:8080;
             proxy_redirect default;          
    }

    // omitted this part
    // ....
    // ....
}

- 5. Enjoy!
 - Initial administrator account/password
    - admin/build (password changable)
 - Account Creation Key
    - "kcreation" (unchangable)

========================= Advanced Setting ============================

- 6. notification (sending email) setting
 - setting for mail sending
   - create gmail account for notification
   - cd /opt/kf6/server/componets/kfmail
   - cp -rp setting.js.sample setting.js
   - write setting.js
 - sending test
   - wget http://url/api/notifications/tick
 - crontab setting for periodically sending the notifications
   -  0 */2 * * * wget http://localhost/api/notifications/tick -O /dev/null




