package tools

import (
	"fmt"
	"io"
	"path/filepath"
	"runtime"

	"github.com/sirupsen/logrus"
	log "github.com/sirupsen/logrus"
	"gopkg.in/natefinch/lumberjack.v2"
)

// Logs struct holds the log file name.
// You can extend this struct with more configurations if needed.
type Logs struct {
	LogFileName string
}

// Logger interface defines the logging methods.
type Logger interface {
	Trace(...interface{})
	Tracef(string, ...interface{})
	Debug(...interface{})
	Debugf(string, ...interface{})
	Info(...interface{})
	Infof(string, ...interface{})
	Warn(...interface{})
	Warnf(string, ...interface{})
	Error(...interface{})
	Errorf(string, ...interface{})
}

// Logf defines the function signature for formatted logging.
type Logf func(string, ...interface{})

// Log defines the function signature for unformatted logging.
type Log func(...interface{})

// Initialize a new Logrus logger instance.
var logger = logrus.New()

// WithField and WithFields are shortcuts to add fields to logs.
var WithField, WithFields = logger.WithField, logger.WithFields

// Define logging functions mapped to the logger's methods.
var (
	Trace  Log  = logger.Trace
	Debug  Log  = logger.Debug
	Info   Log  = logger.Info
	Warn   Log  = logger.Warn
	Error  Log  = logger.Error
	Print  Log  = func(l ...interface{}) { fmt.Println(l...) }
	Tracef Logf = logger.Tracef
	Debugf Logf = logger.Debugf
	Infof  Logf = logger.Infof
	Warnf  Logf = logger.Warnf
	Errorf Logf = logger.Errorf
	Printf Logf = func(s string, l ...interface{}) {
		fmt.Printf(s, l...)
		fmt.Printf("\n")
	}
)

// InitLogger initializes the Logrus logger with specified configurations.
// It sets up log rotation, log level, output destinations, and formatter with CallerPrettyfier.
func (tool *Logs) InitLogger(filePath string, level uint32) {
	// Setup lumberjack logger for log rotation
	lumberjackLogger := &lumberjack.Logger{
		Filename:   filePath,
		MaxSize:    100, // megabytes; adjust as needed
		MaxBackups: 5,
		MaxAge:     28,   // days
		Compress:   true, // compress rotated files
	}

	// Setup multi-writer: file and optionally stdout
	var mw io.Writer
	// Uncomment the next line to also log to stdout
	// mw = io.MultiWriter(os.Stdout, lumberjackLogger)
	mw = io.MultiWriter(lumberjackLogger)

	// Set the log level based on the provided level
	logLevel := log.Level(level)
	log.SetLevel(logLevel)

	// Enable caller reporting to include file and function information
	log.SetReportCaller(true)

	// Customize the log formatter to include caller information elegantly
	log.SetFormatter(&log.TextFormatter{
		DisableQuote:  true,
		DisableColors: false,
		FullTimestamp: true,
		// CallerPrettyfier formats the function and file information
		CallerPrettyfier: func(frame *runtime.Frame) (function string, file string) {
			// Extract the file name without the full path
			filename := filepath.Base(frame.File)
			// Format the function name and file location
			return fmt.Sprintf("%s()", frame.Function), fmt.Sprintf("%s:%d", filename, frame.Line)
		},
	})

	// Set the output destinations
	log.SetOutput(mw)

	// Optional: Switch to JSONFormatter if preferred
	// log.SetFormatter(&log.JSONFormatter{
	// 	TimestampFormat: "2006-01-02T15:04:05Z07:00",
	// })
}

// MapLogLevelStringToNumber maps string log levels to Logrus log level numbers.
func (tool *Logs) MapLogLevelStringToNumber(input string) int {
	stringToNumber := map[string]int{
		"trace": 6,
		"debug": 5,
		"info":  4,
		"warn":  3,
		"error": 2,
	}

	if value, found := stringToNumber[input]; found {
		return value
	}

	// Return a default value or an error code if the input string is not found
	// For example, return -1 for unknown strings
	return -1
}
