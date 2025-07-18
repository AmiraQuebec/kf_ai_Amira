'use strict';

angular.module('kf6App')
    .controller('HelpCtrl', function($scope, $http) {
        $scope.emails = [];
        $http.get('/api/users/me').success(function(me) {
                var myself = {};
                myself.value = me.firstName + " " + me.lastName + " <" + me.email + ">";
                myself.name = me.firstName + " " + me.lastName + " <" + me.email + ">";
                $scope.emails.push(myself);
                $scope.emails.push({"value":"Anonyme", "name":"Anonyme"});
                $scope.userInfo = $scope.emails[0].value;
                $scope.selected = $scope.emails[0].value;
        });
        $scope.input = {fbTitle:'',fbContent:''};
        $scope.warningShow = false;
        $scope.msgShow = false;
        $scope.checkboxes = {"browser": true, "community": true};
        $scope.sendFeedback = function(){
            if($scope.input.fbTitle === undefined || $scope.input.fbTitle === "") {
                $scope.msgShow = true;
                $scope.msg = "Title feild can not be empty.";
                return;
            }
            if($scope.input.fbContent === undefined || $scope.input.fbContent === ""){
                $scope.msgShow = true;
                $scope.msg = "Description feild can not be empty.";
                return;
            }
            var content = "";
            //get browser info
            if($scope.checkboxes.browser){
                content = "Browser version: " + $scope.sayswho() + "\n";
            }
            //get community info
            if($scope.checkboxes.community){
                content = content + "Community: " + $scope.community.community.title + "\n";
            }
            content  = content + $scope.input.fbContent;

            $http.post('/api/help/send', {
                email:$scope.selected,
                subject:$scope.input.fbTitle,
                content:content
            }).success(function() {
                // $scope.msg_show = true;
                // $scope.msg = "Your feedback has been sent to the administrator.";
                // document.getElementById("msg_div").style.color = "green";
                window.alert("Your feedback has been sent to the administrator. ");
                $scope.clearForm();
                $scope.status.isHelpCollapsed = true;
            }).error(function() {
                $scope.msgShow = true;
                $scope.msg = "Failed to send your feedback.";
                document.getElementById("msg_div").style.color = "red";
            });
        };

        $scope.update = function(option){
            if(option === "Anonymous"){
                $scope.warningShow = true;
                $scope.selected = "Anonymous";
            }
            else{
                $scope.warningShow = false;
                $scope.selected = option;
            }
        };

        $scope.clearForm = function(){
            $scope.input = {};
            $scope.msgShow = false;
            $scope.checkboxes = {"browser": true, "community": true};
        };

        $scope.sayswho = function(){
            var ua= navigator.userAgent, tem,
            M= ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
            if(/trident/i.test(M[1])){
                tem=  /\brv[ :]+(\d+)/g.exec(ua) || [];
                return 'IE '+(tem[1] || '');
            }
            if(M[1]=== 'Chrome'){
                tem= ua.match(/\b(OPR|Edge)\/(\d+)/);
                if(tem !== null) {
                    return tem.slice(1).join(' ').replace('OPR', 'Opera');
                }
            }
            M= M[2]? [M[1], M[2]]: [navigator.appName, navigator.appVersion, '-?'];
            if((tem= ua.match(/version\/(\d+)/i)) !== null) {
                M.splice(1, 1, tem[1]);
            }
            return M.join(' ');
        };

    });
