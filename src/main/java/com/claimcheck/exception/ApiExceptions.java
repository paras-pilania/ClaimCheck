package com.claimcheck.exception;

public final class ApiExceptions {

    private ApiExceptions() {
    }

    public static class NotFoundException extends RuntimeException {
        public NotFoundException(String message) {
            super(message);
        }
    }

    public static class DuplicateClaimException extends RuntimeException {
        public DuplicateClaimException(String message) {
            super(message);
        }
    }

    public static class InvalidStatusTransitionException extends RuntimeException {
        public InvalidStatusTransitionException(String message) {
            super(message);
        }
    }

    /** The caller's version does not match the claim's current version. */
    public static class StaleVersionException extends RuntimeException {
        public StaleVersionException(String message) {
            super(message);
        }
    }

    public static class BadRequestException extends RuntimeException {
        public BadRequestException(String message) {
            super(message);
        }
    }

    /** AI is not configured, unreachable, timed out, or rate limited. */
    public static class AiUnavailableException extends RuntimeException {
        public AiUnavailableException(String message) {
            super(message);
        }
    }

    /** AI responded, but the response was unusable or failed validation. */
    public static class AiResponseException extends RuntimeException {
        public AiResponseException(String message) {
            super(message);
        }
    }
}
