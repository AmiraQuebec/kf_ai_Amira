# Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/)

## [Unreleased]
### Added
-

### Changed
-

### Fixed
-

## [6.11.14] - 2020-06-04
### Added
-

### Changed
-

### Fixed
- Search query input box respects anonymous users, but not displaying their usernames.

## [6.11.13] - 2020-05-23
### Added
- Feature to Rename writers in a community in bulk using a CSV

### Changed
- username can be hidden from being displayed in author-selector dropdown - aid for anonymous communities.

### Fixed
- -

## [6.11.12] - 2020-05-03
### Added
- Registrations are sorted in ascending order.
- Communities can be marked as "archived"
- Student Dictionary New feature.
- Notes translation.
- Notes Hierarchy view

### Changed
- Wordcloud removed from  Keyconcepts.

### Fixed
- Search & view filter.

## [6.11.11] - 2019-10-18
### Added
- Added new API to get Notes Count

### Changed
- Added German language stopwords in Wordcloud.

### Fixed
- NA

## [6.11.10] - 2019-10-15
### Added
- Added new language - simplified chinese

### Changed
- Scaffold filter more options added.

### Fixed
- Sync error fixed.

## [6.11.9] - 2019-09-05
### Added
- None

### Changed
- None

### Fixed
- display for viewing notes on a view with views

## [6.11.7] - 2019-09-05
### Added
- New (hierarchical) display for viewing notes on a view. Enable in community settings.

### Changed
- None

### Fixed
- None

## [6.11.6] - 2019-09-03
### Added
- Mark notes as favorite
- Filter notes on the view.

### Changed
- None

### Fixed
- None

## [6.11.5] - 2019-08-27
### Added
- None

### Changed
- Google Drive Added as safe URL for angularjs
- Temporarly disabled Upload video to google drive

### Fixed
- Font Size reverted to 11px

## [6.11.3] - 2019-08-16
### Added
- Show Scaffold Button is back

### Changed
- -

### Fixed
- Draw on Image works
- Minimum Width for Search columns removed.


## [6.11.2] - 2019-08-08
### Added
- Videos have comments.
- Flip firstname and lastname support for countries where lastname is written before first name.
- Managers can rename writers in the community.
- Feature to show wordcount on each note.
- LTI v1 support added to KF
- KBDAC Tool integration added in analytics tools.
- ChangeLog modal 

### Changed
- Paste in note body supports special symbols and other note references.
- Only Admin can delete other Managers in a community.
- Drawings on a view are scalable. 

### Fixed
- Google Drive integration : Note content is synced.
- Student profile search API fetches notes and Rise aboves.


## [6.10.4]
### Added
- [Important] New requirement : a server.js file placed at the root folder. This file centralizes and controls important server settings. See the server.sample.js file as a model.
- [Important] New server setting to control the username case sensitivity of a local user account at login (default = false). (issue #47)
- MONGODB_URI environment variable in production mode (in addition to existing ones)
- Redirect a user to the original request URL after login was required (issue #3)
- Add Google Docs and Draw on Image (with options to enable or disable)
- Replace the "account creation key" in account creation page by Google ReCAPTCHA v2 (issue #79) 

### Changed
- The mail settings (server/components/kfmail/kfmail.js) are moved to the new settings.js.
- Block the creation of local user accounts having a username that already exists in a case insensitive manner.
- Sort communities alphabetically in the Home page (communitymanager). (issue #45)
- Allow an admin to create a community registration (Author object) for another user through the API. (issue #54)
- 'Beta' label removed from the navigation bar (issue #75)
- RelatedWord / WordWhisper plugin removed for now because of performance issues (issue #32)

## Fixed
- Specify 'local' provider filter for local accounts on registration validation and login.


## [6.9.0]
### Changed
- Many dependencies updates (mostly in December 2016 and January 2017)
- 6.8.x Albany developments merged
- Promising ideas tool integrated but disabled by default (community setting)


# [...] Previous changes not documented (yet)
