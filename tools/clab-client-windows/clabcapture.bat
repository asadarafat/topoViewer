@ECHO ON

SET S=%1
SET S=%S:clab-capture://=%
ECHO %S%

FOR /f "tokens=1,2,3 delims=? " %%a IN ("%S%") DO SET HOSTRAW01=%%a&SET CLABNODE=%%b&SET INT=%%c
IF "%INT%" == "pnet0" SET FILTER=" not port 22"

FOR /f "tokens=1,2 delims=@ " %%a IN ("%HOSTRAW01%") DO SET USERLOGIN=%%a&SET HOSTRAW02=%%b
FOR /f "tokens=1 delims=/ " %%a IN ("%HOSTRAW02%") DO SET HOSTRAW03=%%a
FOR /f "tokens=1 delims=: " %%a IN ("%HOSTRAW03%") DO SET HOST=%%a


ECHO "USERNAME: %USERNAME%..."
ECHO "USERLOGIN: %USERLOGIN%..."
ECHO "HOSTRAW02: %HOSTRAW02%..."
ECHO "HOSTRAW03: %HOSTRAW03%..."
ECHO "HOST: %HOST%..."
ECHO "CLAB-NODE:  %CLABNODE%..."
ECHO "INT:  %CLABNODE%..."
ECHO "INT:  %INT%..."
ECHO "Connecting to %USERLOGIN%@%HOST%..."
ssh %USERLOGIN%@%HOST% "sudo -S /sbin/ip netns exec %CLABNODE% tcpdump -ni %INT% -w - not port 22" | "C:\Program Files\Wireshark\Wireshark.exe" -k -i -
PAUSE