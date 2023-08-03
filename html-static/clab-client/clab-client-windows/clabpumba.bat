@ECHO ON

SET S=%1
SET S=%S:clab-pumba://=%
ECHO %S%

FOR /f "tokens=1,2,3,4,5,6,7,8 delims=? " %%a IN ("%S%") DO SET HOSTRAW01=%%a&SET CLABNODE=%%b&SET INT=%%c&SET DELAY=%%d&SET JITTER=%%e&SET RATE=%%f&SET LOSS=%%g&SET DURATION=%%h&SET
IF "%INT%" == "pnet0" SET FILTER=" not port 22"

FOR /f "tokens=1,2 delims=@ " %%a IN ("%HOSTRAW01%") DO SET USERLOGIN=%%a&SET HOSTRAW02=%%b
FOR /f "tokens=1 delims=/ " %%a IN ("%HOSTRAW02%") DO SET HOSTRAW03=%%a
FOR /f "tokens=1 delims=: " %%a IN ("%HOSTRAW03%") DO SET HOST=%%a


ECHO "USERNAME: %USERNAME%..."
ECHO "HOSTRAW02: %HOSTRAW02%..."
ECHO "HOSTRAW03: %HOSTRAW03%..."
ECHO "HOST: %HOST%..."
ECHO "CLABNODE:  %CLABNODE%..."
ECHO "INT:  %INT%..."
ECHO "DURATION:  %DURATION%..."
ECHO "RATE:  %RATE%..."
ECHO "DELAY:  %DELAY%..."
ECHO "LOSS:  %LOSS%..."
ECHO "JITTER:  %JITTER%..."
ECHO "Connecting to %USERNAME%@%HOST%..."
ECHO "

ssh %USERNAME%@%HOST% "pumba netem --interface %INT% --duration %DURATION%m delay --time %DELAY%  %CLABNODE%"
PAUSE