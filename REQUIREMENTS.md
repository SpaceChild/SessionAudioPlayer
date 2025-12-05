# Session Audio Player

## Description
- Web-based Audio Streaming Player for MP3 files
- source of all audio files is a folder within the nextcloud which is running in a docker container
- by opening or refreshing the webapp, the specified audio files folder is scanned for mp3 files
- i can stream the audio files through the webapp
- i see the progress of the currently playing file in form of a slider which i can move manually to skip/jump to a different time
- the files in the folder will be of a long play time (30 Minutes or up to 1-2 hours)
- i need a play/pause button in the interface to play and stop a selected mp3 file
- i want to create marks of the current play time for the currently running file to mark specific parts in the long mp3 files
- the webapp will only read the mp3 files, nothing is written to the mp3 files

## Security
- the webapp is accessable from the open internet
- check the existing CLAUDE.md file for the current software configuration of the raspberry pi
- i want to use the subdomain sessionaudio.spacechild.de to access the webapp
- it should only be accessable through HTTPS
- i want to use CloudFlare as for the other configured subdomains, same procedure for accessing the frontend by a browser as used for the other applications running in the other docker containers
- the webapp is protected by a password
- I don't need a complex user management system as I will use the webapp only on my own
- after 3 attempts with a wrong password, the webapp should be blocked, no access is possible anymore
- i can restore the blocked webapp by modifying the database

## Technical details
- the webapp is created in a modern UI with a modern web framework
- it needs to be responsive to be used with a mobile phone
- i want to listen to the mp3 files and take marks while listening on the go
- the webapp runs in a docker container on the raspberry pi (this machine)
- the backend should also run in a docker container (would be best to have both backend and frontend running in the same docker container if possible)
- the other running docker containers should not be influenced and should continue running

## Functionality details
- when starting up the webapp, the folder with the mp3s is scanned
- the folder is named "SessionAudio" in the root of my nextcloud user "Tim"
- for each of the scanned mp3 files a database entry is created for the exact filename of the file
- if an entry already exists for a file, nothing is done
- in the webapp after authenticating with a password, I see a list of all the database entries (the scanned files) sorted by date descending (newest entries are on top)
- the list entries show the file name of the mp3 file and the creation date of the mp3 file in 2 rows within the list entry (file name on top in bold, creation date in normal font under the file name)
- if there are entries in the database for which there's no corresponding mp3 file present in the folder, the entry in the list is grayed out
- by right-clicking (desktop) or tap and hold (on mobile) on a list entry a context menu opens with to option "delete"
- deletion is also possible with grayed-out entries
- by selecting "delete" the corresponding database entry is deleted and also all related time mark entries for that entry
- after deletion, the list of mp3 files is updated
- by tapping/clicking on a (not grayed out) entry, the player interface opens with play/pause button and a slider for the play progress
- on the top of the player interface view, the name of the selected mp3 file is shown
- I want to see the current play time increasing while playing in the format hh:mm:ss on the left side directly under the progress slider and the time decreasing and going backwards on the right side in the format -hh:mm:ss (negative time, starting by the total play time and ending at -00:00:00)
- in ther player interface, a prominent button is visible for taking a mark at the current play position
- by tapping/clicking the mark button, the audio keeps playing but creates a "mark-entry" and asks for an optional description of the mark
- the mark is related to the currently playing file (as a relation in the relational database) and has the properties "time" for the exact time mark of the corresponding file and "note" for an optional note, can be left empty
- in the bottom half of the player interface view, a list of all taken marks is shown (sorted by time, ascending, earliest times on top)
- a mark entry in the list shows the time and note of the mark in 2 rows (the time in "hh:mm:ss" in bold font and the note in normal font under the time in a second row within the list entry)
- if the note has too much characters, it will be shown shortened with "..." at the end
- by tapping/clicking on a time mark in the list, the progress slider jumps to that exact play position and keeps playing from that position (if not playing, the slider just jumps to that position and can then by played back manually by clicking/tapping the play-button)
- by right-clicking (on desktop) or by tap and hold (on mobile) a context menu opens that shows the option "delete" to delete that time mark
- by selecting "delete", the time mark entry is deleted from the database and the list of time marks is updated