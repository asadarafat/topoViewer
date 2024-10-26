# exampleScript.py

import sys

def main():
    # Example of receiving arguments from command line
    if len(sys.argv) > 1:
        arg1 = sys.argv[1]
        arg2 = sys.argv[2]
        print(f"Argument 1: {arg1}")
        print(f"Argument 2: {arg2}")

    # Example of printing some output
    print("Python script execution successful!")
    print("Here is some output from the Python script.")

if __name__ == "__main__":
    main()
