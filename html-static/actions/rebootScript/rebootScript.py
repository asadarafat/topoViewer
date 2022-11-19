import argparse
import os
import logging
from netmiko import ConnectHandler, file_transfer
from pylogrus import PyLogrus, TextFormatter


def get_logger():
    logging.setLoggerClass(PyLogrus)

    logger = logging.getLogger(__name__)  # type: PyLogrus
    logger.setLevel(logging.DEBUG)

    formatter = TextFormatter(datefmt="Z", colorize=True)
    # formatter.override_level_names({"CRITICAL": "CRIT", "ERROR": "ERRO", "WARNING": "WARN", "DEBUG": "DEBU"})
    # formatter.override_colors({"prefix": CL_BLDYLW})

    ch = logging.StreamHandler()
    ch.setLevel(logging.DEBUG)
    ch.setFormatter(formatter)
    logger.addHandler(ch)

    return logger

def NokiaSrosReboot(ip_address, username, password, device_name, directory):
    log = get_logger() ## init logger
    device = {
        "device_type": "nokia_sros", # device type is fixed, you shouldn"t change this
        "ip": ip_address, # IP address to connect to your device via SSH
        "username": username, # username for SSH
        "password": password # password for SSH
    }

    # Establish SSH connection to device
    SSH = ConnectHandler(**device)
    if SSH.check_config_mode:
        try:
            log.info ("Device is MD-CLI...")

            # Send a command and print output
            log.info (SSH.send_command("show version"))
            log.info ("Rebooting the device..")
            SSH.send_command("admin reboot now")
            
        except Exception as e:
            log.error("An error occurred during device reboot: %s", e)

        finally:
            log.info (SSH.disconnect())
            log.info("SSH connection closed")
    else:
        log.info ("Device is Classic CLI... Script does not support Classic CLI...")
        
    SSH.disconnect()


def main():

    parser = argparse.ArgumentParser(
        description="Backup and Restore device configuration.",
        formatter_class=argparse.RawTextHelpFormatter,
        usage="""backupRestoreScript.py --ip_address IPADDRESS --username USERNAME --password PASSWORD --devicename DEVICENAME --kind KIND --directory DIRECTORY [--reboot] 
Examples:
    python3 rebootScript.py --ip_address 10.2.1.110 --username admin --password admin --devicename Router1 --directory /path/to/backup --reboot
""")

    parser.add_argument("--ip_address", required=True, help="IP address of the device")
    parser.add_argument("--username", required=True, help="Username for SSH login")
    parser.add_argument("--password", required=True, help="Password for SSH login")
    parser.add_argument("--devicename", required=True, help="Name of the device for backup/restore file naming")
    parser.add_argument("--directory", "-d", required=True, help="Directory where backup/restore files should be saved")
    parser.add_argument("--kind", required=True, help="Device kind ie: sros")
    parser.add_argument("--reboot", action="store_true", help="Reboot the device")

    args = parser.parse_args()

    if not any(vars(args).values()):
        parser.print_help()
    elif args.reboot:
        if args.kind == "vr-sros":
            NokiaSrosReboot(args.ip_address, args.username, args.password, args.devicename, args.directory)
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
