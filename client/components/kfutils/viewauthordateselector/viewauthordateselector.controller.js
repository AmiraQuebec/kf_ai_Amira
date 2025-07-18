'use strict';

angular.module('kf6App')
    .controller('ViewAuthorDateSelectorCtrl', function ($scope) {
        $scope.queryString = '';
        $scope.selectedItems = [];
        var views = 'View(s): ';
        var authors = 'Author(s): ';
        var todate = 'To Date: ';
        var fromdate = 'From Date: ';
        $scope.viewSelected = function (each) {
            $scope.selectedItems.push({
                viewTitle: each.title
            });
            views += each.title + ', ';
            $scope.queryString += ' -view:' + each._id;
            $scope.setSelectedData($scope.queryString, $scope.selectedItems, views, authors, todate, fromdate);
        };

        $scope.authorSelected = function (author) {
            $scope.selectedItems.push({
                author: author.userName
            });
            authors += author.firstName + ' ' + author.lastName + ' (' + author.userName + '), ';
            $scope.queryString += ' -author:' + author.userName;
            $scope.setSelectedData($scope.queryString, $scope.selectedItems, views, authors, todate, fromdate);
        };

        $scope.dateSelectedTo = function (to) {
            $scope.selectedItems.push({
                toDate: new Date(to).toLocaleString()
            });
            todate += new Date(to).toLocaleString() + ', ';
            $scope.queryString += ' -to:' + to.toISOString();
            $scope.setSelectedData($scope.queryString, $scope.selectedItems, views, authors, todate, fromdate);
        };

        $scope.dateSelectedFrom = function (from) {
            $scope.selectedItems.push({
                fromDate: new Date(from).toLocaleString()
            });
            fromdate += new Date(from).toLocaleString() + ', ';
            $scope.queryString += ' -from:' + from.toISOString();
            $scope.setSelectedData($scope.queryString, $scope.selectedItems, views, authors, todate, fromdate);
        };

        $scope.clearSelectedItems = function () {
            views = 'View(s): ';
            authors = 'Author(s): ';
            todate = 'To Date: ';
            fromdate = 'From Date: ';
            $scope.selectedItems.length = 0;
            $scope.queryString = '';
            $scope.setSelectedData($scope.queryString, $scope.selectedItems, views, authors, todate, fromdate);
        };

    });
