This is python action script for backup and restore

install python requirement
```
pip3 install -r requirements.txt --user
```

```
usage: backupRestoreScript.py --ip_address IPADDRESS --username USERNAME --password PASSWORD --devicename DEVICENAME --kind KIND --directory DIRECTORY [--backup] [--restore]

Examples:
    python3 backupRestoreScript.py --ip_address 10.2.1.110 --username admin --password admin --devicename Router1 --directory /path/to/backup --backup
    python3 backupRestoreScript.py --ip_address 10.2.1.110 --username admin --password admin --devicename Router1 --directory /path/to/backup --restore

Backup and Restore device configuration.

optional arguments:
  -h, --help            show this help message and exit
  --ip_address IP_ADDRESS
                        IP address of the device
  --username USERNAME   Username for SSH login
  --password PASSWORD   Password for SSH login
  --devicename DEVICENAME
                        Name of the device for backup/restore file naming
  --directory DIRECTORY, -d DIRECTORY
                        Directory where backup/restore files should be saved
  --kind KIND           Device kind ie: sros
  --backup              Backup the device configuration
  --restore             Restore the  configuration
```