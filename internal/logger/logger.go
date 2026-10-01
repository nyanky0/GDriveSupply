package logger

import (
	"bufio"
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"sync/atomic"
	"time"
)

type LogLevel string

const (
	LevelDebug LogLevel = "DEBUG"
	LevelInfo  LogLevel = "INFO"
	LevelWarn  LogLevel = "WARN"
	LevelError LogLevel = "ERROR"
)

type Entry struct {
	ID        int64     `json:"id"`
	Timestamp time.Time `json:"timestamp"`
	Level     LogLevel  `json:"level"`
	Module    string    `json:"module"`
	Message   string    `json:"message"`
}

type Logger struct {
	mu          sync.RWMutex
	entries     []Entry
	maxEntries  int
	file        *os.File
	filePath    string
	nextID      int64
}

var (
	globalLogger *Logger
	once         sync.Once
)

// InitLogger initializes the global logger singleton with memory ring buffer and file persistence
func InitLogger() *Logger {
	once.Do(func() {
		appData := os.Getenv("APPDATA")
		logDir := filepath.Join(appData, "GDriveSupply", "logs")
		if appData == "" {
			logDir = filepath.Join(".", "logs")
		}
		_ = os.MkdirAll(logDir, 0755)

		logPath := filepath.Join(logDir, "app.log")
		f, err := os.OpenFile(logPath, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
		if err != nil {
			log.Printf("Gagal membuka file log: %v", err)
		}

		l := &Logger{
			entries:    make([]Entry, 0, 5000),
			maxEntries: 5000,
			file:       f,
			filePath:   logPath,
		}

		globalLogger = l

		// Redirect standard Go log package to our logger as [CORE] INFO
		log.SetOutput(&stdLogWriter{logger: l})
		log.SetFlags(0) // timestamp handled by our logger
	})
	return globalLogger
}

func Get() *Logger {
	if globalLogger == nil {
		return InitLogger()
	}
	return globalLogger
}

type stdLogWriter struct {
	logger *Logger
}

func (w *stdLogWriter) Write(p []byte) (n int, err error) {
	msg := strings.TrimSpace(string(p))
	if msg != "" {
		w.logger.Log(LevelInfo, "CORE", msg)
	}
	return len(p), nil
}

// Log records a new log message
func (l *Logger) Log(level LogLevel, module string, message string) {
	l.mu.Lock()
	defer l.mu.Unlock()

	id := atomic.AddInt64(&l.nextID, 1)
	entry := Entry{
		ID:        id,
		Timestamp: time.Now(),
		Level:     level,
		Module:    module,
		Message:   message,
	}

	// Ring buffer trim if exceeds capacity
	if len(l.entries) >= l.maxEntries {
		l.entries = l.entries[1:]
	}
	l.entries = append(l.entries, entry)

	// Format line for console & file
	line := fmt.Sprintf("[%s] [%s] [%s] %s\n",
		entry.Timestamp.Format("2006-01-02 15:04:05.000"),
		entry.Level,
		entry.Module,
		entry.Message,
	)

	// Write to disk file
	if l.file != nil {
		_, _ = l.file.WriteString(line)
	}

	// Also print to stdout for terminal users
	os.Stdout.WriteString(line)
}

func (l *Logger) Infof(module string, format string, args ...interface{}) {
	l.Log(LevelInfo, module, fmt.Sprintf(format, args...))
}

func (l *Logger) Warnf(module string, format string, args ...interface{}) {
	l.Log(LevelWarn, module, fmt.Sprintf(format, args...))
}

func (l *Logger) Errorf(module string, format string, args ...interface{}) {
	l.Log(LevelError, module, fmt.Sprintf(format, args...))
}

func (l *Logger) Debugf(module string, format string, args ...interface{}) {
	l.Log(LevelDebug, module, fmt.Sprintf(format, args...))
}

// GetEntries returns log entries filtered by limit, level, and keyword
func (l *Logger) GetEntries(limit int, minLevel string, keyword string) []Entry {
	l.mu.RLock()
	defer l.mu.RUnlock()

	if limit <= 0 || limit > l.maxEntries {
		limit = l.maxEntries
	}

	keyword = strings.ToLower(strings.TrimSpace(keyword))
	minLevel = strings.ToUpper(strings.TrimSpace(minLevel))

	matched := make([]Entry, 0, len(l.entries))
	for _, e := range l.entries {
		if minLevel != "" && minLevel != "ALL" {
			if string(e.Level) != minLevel {
				continue
			}
		}
		if keyword != "" {
			combined := strings.ToLower(fmt.Sprintf("%s %s %s", e.Module, e.Level, e.Message))
			if !strings.Contains(combined, keyword) {
				continue
			}
		}
		matched = append(matched, e)
	}

	// Return latest entries up to limit
	if len(matched) > limit {
		matched = matched[len(matched)-limit:]
	}
	return matched
}

// Clear clears memory buffer and truncates the log file
func (l *Logger) Clear() {
	l.mu.Lock()
	defer l.mu.Unlock()

	l.entries = make([]Entry, 0, l.maxEntries)
	if l.file != nil {
		_ = l.file.Close()
		l.file, _ = os.OpenFile(l.filePath, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0644)
	}
}

// GetLogFilePath returns the absolute path of the persistent log file
func (l *Logger) GetLogFilePath() string {
	return l.filePath
}

// PipeProcessOutput connects stdout and stderr of a command to the logger in real time
func (l *Logger) PipeProcessOutput(module string, stdout io.Reader, stderr io.Reader) {
	if stdout != nil {
		go func() {
			scanner := bufio.NewScanner(stdout)
			for scanner.Scan() {
				text := strings.TrimSpace(scanner.Text())
				if text != "" {
					l.Log(LevelInfo, module, text)
				}
			}
		}()
	}

	if stderr != nil {
		go func() {
			scanner := bufio.NewScanner(stderr)
			for scanner.Scan() {
				text := strings.TrimSpace(scanner.Text())
				if text != "" {
					lower := strings.ToLower(text)
					level := LevelInfo
					if strings.Contains(lower, "error") || strings.Contains(lower, "failed") || strings.Contains(lower, "fatal") {
						level = LevelError
					} else if strings.Contains(lower, "warn") {
						level = LevelWarn
					} else if strings.Contains(lower, "debug") {
						level = LevelDebug
					}
					l.Log(level, module, text)
				}
			}
		}()
	}
}
