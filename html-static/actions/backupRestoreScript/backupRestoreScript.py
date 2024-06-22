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

def NokiaSrosBackup(ip_address, username, password, device_name, directory):
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
            version = SSH.send_command("show version")
            log.info (version)

            log.info (SSH.send_command("environment more false"))
            log.info (SSH.send_command("configure private"))
            
            # Get configuration output
            config_output = SSH.send_command("info")

            # Determine the backup file path
            backup_filename = f"{device_name}.cfg"
            backup_path = os.path.join(directory, backup_filename)

            # Save the output to a file with the device name in the specified directory
            with open(backup_path, "w") as file:
                file.write(config_output)

            # Revert the environment setting and close SSH connection
            log.info (SSH.send_command("exit"))
            log.info (SSH.send_command("environment more true"))

        except Exception as e:
            log.error("An error occurred during config backup: %s", e)

        finally:
            log.info (SSH.disconnect())
            log.info("SSH connection closed")
    else:
        log.info ("Device is Classic CLI... Script does not support Classic CLI...")
        
    SSH.disconnect()

def NokiaSrosRestore(ip_address, username, password, device_name, directory):
    log = get_logger() ## init logger
    device = {
        "device_type": "nokia_sros", # device type is fixed, you shouldn"t change this
        "ip": ip_address, # IP address to connect to your device via SSH
        "username": username, # username for SSH
        "password": password # password for SSH
    }
    
    SSH = ConnectHandler(**device)
    if SSH.check_config_mode:
        log.info ("Device is MD-CLI...")
        try:
            log.info("SSH connection established to device: %s", ip_address)

            # Determine the restore file path
            restore_filename = f"{device_name}.cfg"
            restore_path = os.path.join(directory, restore_filename)

            transfer = file_transfer(
                SSH,
                source_file=restore_path,
                dest_file=f"{device_name}.cfg",
                file_system="cf3:/",
                direction="put",
                overwrite_file=True
            )
            log.info("File transferred to device: %s", transfer)
            
            log.info(SSH.send_command("configure private"))
            log.info(SSH.send_command(f"load full-replace cf3:\{device_name}.cfg"))
            log.info(SSH.send_command("commit"))

        except Exception as e:
            log.error("An error occurred during SCP: %s", e)

        finally:
            log.info (SSH.disconnect())
            log.info("SSH connection closed")

def main():

    parser = argparse.ArgumentParser(
        description="Backup and Restore device configuration.",
        formatter_class=argparse.RawTextHelpFormatter,
        usage="""backupRestoreScript.py --ip_address IPADDRESS --username USERNAME --password PASSWORD --devicename DEVICENAME --kind KIND --directory DIRECTORY [--backup] [--restore]

Examples:
    python3 backupRestoreScript.py --ip_address 10.2.1.110 --username admin --password admin --devicename Router1 --directory /path/to/backup --backup
    python3 backupRestoreScript.py --ip_address 10.2.1.110 --username admin --password admin --devicename Router1 --directory /path/to/backup --restore
""")

    parser.add_argument("--ip_address", required=True, help="IP address of the device")
    parser.add_argument("--username", required=True, help="Username for SSH login")
    parser.add_argument("--password", required=True, help="Password for SSH login")
    parser.add_argument("--devicename", required=True, help="Name of the device for backup/restore file naming")
    parser.add_argument("--directory", "-d", required=True, help="Directory where backup/restore files should be saved")
    parser.add_argument("--kind", required=True, help="Device kind ie: sros")
    parser.add_argument("--backup", action="store_true", help="Backup the device configuration")
    parser.add_argument("--restore", action="store_true", help="Restore the  configuration")

    args = parser.parse_args()

    if not any(vars(args).values()):
        parser.print_help()
    elif args.backup:
        if args.kind == "vr-sros":
            NokiaSrosBackup(args.ip_address, args.username, args.password, args.devicename, args.directory)
    elif args.restore:
        if args.kind == "vr-sros":
            NokiaSrosRestore(args.ip_address, args.username, args.password, args.devicename, args.directory)
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
