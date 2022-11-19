import argparse
import os
import logging
from logging.handlers import TimedRotatingFileHandler
from netmiko import ConnectHandler, file_transfer
from pylogrus import PyLogrus, TextFormatter
import sys
from datetime import datetime



def get_logger(log_directory):
    logging.setLoggerClass(PyLogrus)
    logger = logging.getLogger(__name__)  # type: PyLogrus
    logger.setLevel(logging.DEBUG)

    formatter = TextFormatter(datefmt="Z", colorize=True)

    # Console handler
    ch = logging.StreamHandler()
    ch.setLevel(logging.DEBUG)
    ch.setFormatter(formatter)
    logger.addHandler(ch)

    # File handler with rolling deletion
    log_filename = os.path.join(log_directory, "backup_restore.log")
    fh = TimedRotatingFileHandler(log_filename, when="midnight", interval=1, backupCount=7)  # Keep logs for 7 days
    fh.setLevel(logging.DEBUG)
    fh.setFormatter(formatter)
    logger.addHandler(fh)

    return logger


def NokiaSrosBackup(ip_address, username, password, config_name, directory, log_directory):
    log = get_logger(log_directory)  # Initialize logger
    device = {
        "device_type": "nokia_sros",  # Device type is fixed, you shouldn't change this
        "ip": ip_address,  # IP address to connect to your device via SSH
        "username": username,  # Username for SSH
        "password": password  # Password for SSH
    }

    # Get the current date and time
    now = datetime.now()

    # Format the timestamp
    formatted_now = now.strftime("%Y-%m-%d-%H-%M-%S")

    log.info("Device Id :%s", ip_address)
    log.info("Device Config Name :%s", config_name)
    log.info("Device Config Directory :%s", directory)

    # join config_name + formatted_now
    config_name = f"{config_name}--{formatted_now}.cfg"


    # Establish SSH connection to device
    SSH = ConnectHandler(**device)
    if SSH.check_config_mode:
        try:
            log.info("Device is SROS MD-CLI...")

            # Send a command and print output
            version = SSH.send_command("show version")
            log.info(version)

            log.info(SSH.send_command("environment more false"))

            # Get configuration output
            config_output = SSH.send_command("admin show configuration configure")
            log.info (config_output)

            # Determine the backup file path
            backup_filename = config_name
            backup_path = os.path.join(directory, backup_filename)

            # Save the output to a file with the device name in the specified directory
            with open(backup_path, "w") as file:
                file.write(config_output)

            # Revert the environment setting and close SSH connection
            log.info(SSH.send_command("exit"))
            log.info(SSH.send_command("environment more true"))

        except Exception as e:
            log.error("An error occurred during config backup: %s", e)

        finally:
            log.info(SSH.disconnect())
            log.info("SSH connection closed")
    else:
        log.info("Device is Classic CLI... Script does not support Classic CLI...")

    SSH.disconnect()


def NokiaSrosRestore(ip_address, username, password, config_name, directory, log_directory):
    log = get_logger(log_directory)  # Initialize logger
    device = {
        "device_type": "nokia_sros",  # Device type is fixed, you shouldn't change this
        "ip": ip_address,  # IP address to connect to your device via SSH
        "username": username,  # Username for SSH
        "password": password  # Password for SSH
    }

    log.info("Device Id :%s", ip_address)
    log.info("Device Config Name :%s.cfg", config_name)
    log.info("Device Config Directory :%s", directory)

    SSH = ConnectHandler(**device)
    if SSH.check_config_mode:
        log.info("Device is SROS MD-CLI...")
        try:
            log.info("SSH connection established to device: %s", ip_address)

            # Determine the restore file path
            restore_filename = f"{config_name}"
            restore_path = os.path.join(directory, restore_filename)

            transfer = file_transfer(
                SSH,
                source_file=restore_path,
                dest_file=config_name,
                file_system="cf3:/",
                direction="put",
                overwrite_file=True
            )
            log.info("File transferred to device: %s", transfer)

            log.info(SSH.send_command("configure private"))
            log.info(SSH.send_command(f"load full-replace cf3:{config_name}"))
            log.info(SSH.send_command("commit"))

        except Exception as e:
            log.error("An error occurred during SCP: %s", e)

        finally:
            log.info(SSH.disconnect())
            log.info("SSH connection closed")

def NokiaSrosGet(ip_address, username, password, config_name, directory, log_directory):
    log = get_logger(log_directory)  # Initialize logger
    device = {
        "device_type": "nokia_sros",  # Device type is fixed, you shouldn't change this
        "ip": ip_address,  # IP address to connect to your device via SSH
        "username": username,  # Username for SSH
        "password": password  # Password for SSH
    }

    config_name = f"{config_name}-running.cfg"

    log.info("Device Id :%s", ip_address)
    log.info("Device Config Name :%s", config_name)
    log.info("Device Config Directory :%s", directory)


    # Establish SSH connection to device
    SSH = ConnectHandler(**device)
    if SSH.check_config_mode:
        try:
            log.info("Device is SROS MD-CLI...")

            # Send a command and print output
            version = SSH.send_command("show version")
            log.info(version)

            log.info(SSH.send_command("environment more false"))

            # Get configuration output
            config_output = SSH.send_command("admin show configuration configure")
            log.info (config_output)

            # Determine the backup file path
            backup_filename = config_name
            backup_path = os.path.join(directory, backup_filename)

            # Save the output to a file with the device name in the specified directory
            with open(backup_path, "w") as file:
                file.write(config_output)

            # Revert the environment setting and close SSH connection
            log.info(SSH.send_command("exit"))
            log.info(SSH.send_command("environment more true"))

        except Exception as e:
            log.error("An error occurred during config backup: %s", e)

        finally:
            log.info(SSH.disconnect())
            log.info("SSH connection closed")
    else:
        log.info("Device is Classic CLI... Script does not support Classic CLI...")

    SSH.disconnect()

def main():
    parser = argparse.ArgumentParser(
        description="Backup and Restore device configuration.",
        formatter_class=argparse.RawTextHelpFormatter,
        usage="""backupRestoreScript.py --ip_address IPADDRESS --username USERNAME --password PASSWORD --configname CONFIGNAME --kind KIND --directory DIRECTORY --log_directory LOG_DIRECTORY [--backup] [--restore]

Examples:
    python3 backupRestoreScript.py --ip_address 10.2.1.110 --username admin --password admin --configname Router10-2024-06-26T08:46:41Z.cfg --kind vr-sros --directory /path/to/backup --log_directory /path/to/logs --backup
    python3 backupRestoreScript.py --ip_address 10.2.1.110 --username admin --password admin --configname Router10-2024-06-26T08:46:41Z.cfg --kind vr-sros --directory /path/to/backup --log_directory /path/to/logs --restore
"""
    )

    parser.add_argument("--ip_address", required=True, help="IP address of the device")
    parser.add_argument("--username", required=True, help="Username for SSH login")
    parser.add_argument("--password", required=True, help="Password for SSH login")
    parser.add_argument("--configname", required=True, help="Name of the device config for backup/restore file naming")
    parser.add_argument("--directory", "-d", required=True, help="Directory where backup/restore files should be saved")
    parser.add_argument("--kind", required=True, help="Device kind ie: sros")
    parser.add_argument("--log_directory", required=True, help="Directory where logs should be saved")
    parser.add_argument("--backup", action="store_true", help="Backup the device configuration")
    parser.add_argument("--restore", action="store_true", help="Restore the configuration")
    parser.add_argument("--get", action="store_true", help="Get the running configuration")


    args = parser.parse_args()

    if not any(vars(args).values()):
        parser.print_help()
    elif args.backup:
        if args.kind == "vr-sros":
            NokiaSrosBackup(args.ip_address, args.username, args.password, args.configname, args.directory, args.log_directory)
    elif args.restore:
        if args.kind == "vr-sros":
            NokiaSrosRestore(args.ip_address, args.username, args.password, args.configname, args.directory, args.log_directory)
    elif args.get:
        if args.kind == "vr-sros":
            NokiaSrosGet(args.ip_address, args.username, args.password, args.configname, args.directory, args.log_directory)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
