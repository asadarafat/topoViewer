package native

import "fmt"

type ErrorCode string

const (
	ErrorCancelled        ErrorCode = "cancelled"
	ErrorConflict         ErrorCode = "conflict"
	ErrorCorruptData      ErrorCode = "corrupt-data"
	ErrorInvalidRequest   ErrorCode = "invalid-request"
	ErrorNotFound         ErrorCode = "not-found"
	ErrorPartialFailure   ErrorCode = "partial-failure"
	ErrorPermissionDenied ErrorCode = "permission-denied"
	ErrorQuotaExceeded    ErrorCode = "quota-exceeded"
	ErrorUnavailable      ErrorCode = "unavailable"
	ErrorUnknown          ErrorCode = "unknown"
)

type ServiceError struct {
	Code      ErrorCode      `json:"code"`
	Details   map[string]any `json:"details,omitempty"`
	Message   string         `json:"message"`
	Retryable bool           `json:"retryable"`
}

func (e *ServiceError) Error() string {
	return fmt.Sprintf("%s: %s", e.Code, e.Message)
}

func NewServiceError(code ErrorCode, message string, retryable bool, details map[string]any) *ServiceError {
	return &ServiceError{
		Code:      code,
		Details:   details,
		Message:   message,
		Retryable: retryable,
	}
}
