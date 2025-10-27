import { sBoolean, sDate, sInteger, sNumber, sString } from '@js20/schema';

export interface Something {
    text: string;
    optional?: number;
    isEnabled: boolean;
    anInteger: number;
    aDate: Date;
    withRegex: string;
}

// Make sure to extend the TS type!
export const sSomething: Something = {
    text: sString().maxLength(200).type(),
    optional: sNumber().optional().type(),
    isEnabled: sBoolean().type(),
    anInteger: sInteger().min(0).max(1).type(),
    aDate: sDate().type(),
    withRegex: sString().matches(/^[a-z]+$/).type(),
};
