#!/usr/bin/osascript

on run argv
set captureUrl to argv as text

set ServerUserName to do shell script "awk -F'[://?@]' '{print $4}'<<<" & quoted form of captureUrl
set ServerAddress  to do shell script "awk -F'[://?@]' '{print $5}'<<<" & quoted form of captureUrl
set ServerPort     to do shell script "awk -F'[://?@]' '{print $5}'<<<" & quoted form of captureUrl
set clabNodeId     to do shell script "awk -F'[://?@]' '{print $6}'<<<" & quoted form of captureUrl
set clabNodePortId to do shell script "awk -F'[://?@]' '{print $7}'<<<" & quoted form of captureUrl

tell application "iTerm2"
    set newWindow to (create window with default profile)
    tell current session of newWindow

        --  write text ServerUserName
        write text "echo ServerAddress: " & ServerAddress 
        write text "echo ServerPort: " & ServerPort    
        write text "clabNodeId" &clabNodeId    
        write text "clabNodePortId: " & clabNodePortId

         write text "ssh suuser@" & ServerAddress &" \"sudo -S /sbin/ip netns exec "& clabNodeId &" tcpdump -U -nni "& clabNodePortId &" -w -\" | wireshark -k -i -"

        --  write text "ssh suuser@138.203.40.63 \"sudo -S /sbin/ip netns exec clab-vsrnrc-topo-VSR-NRC-01 tcpdump -U -nni eth1 -w -\" | wireshark -k -i -"
    end tell
end tell
end run