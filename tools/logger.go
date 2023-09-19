package tools

import (
	"io"
	"os"

	log "github.com/sirupsen/logrus"

	"gopkg.in/natefinch/lumberjack.v2"
)

type Logs struct {
	LogFileName string
}

// log level
// // A constant exposing all logging levels
// var AllLevels = []Level{
// 	PanicLevel, 0
// 	FatalLevel, 1
// 	ErrorLevel, 2
// 	WarnLevel,  3
// 	InfoLevel,  4
// 	DebugLevel, 5
// 	TraceLevel, 6
// }

// const (
// 	// PanicLevel level, highest level of severity. Logs and then calls panic with the
// 	// message passed to Debug, Info, ...
// 	PanicLevel Level = iota
// 	// FatalLevel level. Logs and then calls `logger.Exit(1)`. It will exit even if the
// 	// logging level is set to Panic.
// 	FatalLevel
// 	// ErrorLevel level. Logs. Used for errors that should definitely be noted.
// 	// Commonly used for hooks to send errors to an error tracking service.
// 	ErrorLevel
// 	// WarnLevel level. Non-critical entries that deserve eyes.
// 	WarnLevel
// 	// InfoLevel level. General operational entries about what's going on inside the
// 	// application.
// 	InfoLevel
// 	// DebugLevel level. Usually only enabled when debugging. Very verbose logging.
// 	DebugLevel
// 	// TraceLevel level. Designates finer-grained informational events than the Debug.
// 	TraceLevel
// )

func (tool *Logs) InitLogger(filePath string, level uint32) {
	// os.Stdout sending log to standard IO a.k.a session console
	mw := io.MultiWriter(os.Stdout, &lumberjack.Logger{
		// mw := io.MultiWriter(&lumberjack.Logger{
		Filename:   filePath,
		MaxSize:    10, // megabytes
		MaxBackups: 3,
		MaxAge:     28,   //days
		Compress:   true, // disabled by default
	})
	log.SetLevel(log.Level(level))
	log.SetOutput(mw)

	// log.SetFormatter(&nested.Formatter{})

	log.SetFormatter(&log.TextFormatter{
		DisableQuote:  true,
		DisableColors: false,
		FullTimestamp: true})

	// log.SetFormatter(&log.JSONFormatter{})
}
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
