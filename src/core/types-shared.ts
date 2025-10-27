/*
These files are included in the generated frontend clients,
so avoid adding any backend-specific code here.
*/
import { sDate, sString } from '@js20/schema';

export interface Instance {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    ownerId?: string;
}

export interface IdInput {
    id: string;
}

export interface Message {
    message: string;
}

export const sInstance: Instance = {
    id: sString().nonEmpty().type(),
    createdAt: sDate().type(),
    updatedAt: sDate().type(),
    ownerId: sString().nonEmpty().optional().type(),
};

export const sIdInput: IdInput = {
    id: sString().nonEmpty().type(),
};

export const sMessage: Message = {
    message: sString().nonEmpty().type(),
};