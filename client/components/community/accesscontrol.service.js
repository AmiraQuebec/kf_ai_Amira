'use strict';

angular.module('kf6App')
    .factory('$ac', function($community) {
        var authorRequirementTable = {
            private: {
                r: true,
                w: true
            },
            protected: {
                r: false,
                w: true
            },
            public: {
                r: false,
                w: false
            }
        };

        var fullfillRequirement = function(object, author, requiredPermission) {
            if (!object || !author) {
                return false;
            }

            if (author.role === 'manager') {
                return true;
            }

            if (authorRequirementTable[object.permission][requiredPermission] === false) {
                return true;
            }

            //author requirement
            return isAuthorOrGroupMember(object, author);
        };

        var isAuthorOrGroupMember = function(object, author) {
            return isAuthor(object, author) || isGroupMember(object, author);
        };

        var isAuthor = function(object, author) {
            //This is not work because ObjectId object is different
            //return _.includes(object.authors, author._id.toString());
            return object.authors.indexOf(author._id) >= 0;
        };

        var isGroupMember = function(object, author) {
            if (!object._groupMembers) {
                return false;
            }
            return object._groupMembers.indexOf(author._id) >= 0;
        };

        var isManager = function() {
            var author = $community.getCommunityData().author;
            if (!author) {
                return false;
            }
            return author.role === 'manager';
        };

        var isEditable = function(object) {
            return fullfillRequirement(object, $community.getCommunityData().author, 'w');
        };

        var isReadable = function(object) {
            return fullfillRequirement(object, $community.getCommunityData().author, 'r');
        };

        return {
            fullfillRequirement: fullfillRequirement,
            isAuthor: isAuthor,
            isManager: isManager,
            isEditable: isEditable,
            isReadable: isReadable,
            mixIn: function(scope, object) {
                scope.isEditable = function() {
                    return isEditable(object);
                };
                scope.isManager = isManager;
            }
        };
    });
