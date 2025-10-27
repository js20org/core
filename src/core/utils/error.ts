import { SchemaInvalidError, SchemaInvalidValueError } from '@js20/schema';
import { ErrorHandler, ErrorResponse } from '../types';
import { ISchemaIssue } from '@js20/schema/dist-esm/types';

export async function globalHandleError(error: any, errorHandler?: ErrorHandler): Promise<ErrorResponse> {
    const validationError = getValidationError(error);

    if (validationError) {
        return validationError;
    }

    const {
        error: customMessage,
        code: customCode,
        additionalInfo: customData,
    } = errorHandler ? await errorHandler(error) : {};

    const errorMessage = getErrorMessage(error);

    return {
        error: customMessage || errorMessage || 'Unknown error',
        code: customCode || 500,
        additionalInfo: customData,
    };
}

function getErrorMessage(error: any): string | null {
    if (error instanceof Error) {
        return error.message;
    } else if (typeof error === 'string') {
        return error;
    } else {
        return null;
    }
}

const getValidationError = (error: any): ErrorResponse | null => {
    const isSchemaInvalidError = error instanceof SchemaInvalidError;
    const isSchemaInvalidValueError = error instanceof SchemaInvalidValueError;

    if (isSchemaInvalidError) {
        const { issue } = error as SchemaInvalidError;

        return {
            code: 400,
            error: 'Invalid schema - The provided schema is invalid.',
            additionalInfo: getIssueInfo(issue),
        };
    } else if (isSchemaInvalidValueError) {
        const typedError = error as SchemaInvalidValueError;

        return {
            code: 400,
            error: 'Invalid value - The provided value does not match the schema.',
            additionalInfo: getIssueInfo(typedError.issue),
        };
    } else {
        return null;
    }
};

const getIssueInfo = (schemaIssue: ISchemaIssue) => {
    const { fieldKeys, reason, schema } = schemaIssue;
    const fieldString = (fieldKeys || []).join('.');

    return {
        reason,
        schema,
        field: fieldString || '(root)',
    };
};
