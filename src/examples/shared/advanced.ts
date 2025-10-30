import { type Model } from '@js20/core';
import { sBoolean, sEnum, sNumber, sString } from '@js20/schema';

// Make sure it is always included
import * as TypesShared from '../../core/types-shared.js';
typeof TypesShared;

export enum Currency {
    USD = 'USD',
    EUR = 'EUR',
}

export interface Car {
    isLeased: boolean;
    registrationNumber: string;
}

export interface Fee {
    amount: number;
    currency: Currency;
}

export interface MyModels {
    car: Model<Car>;
    fee: Model<Fee>;
}

export const sCar: Car = {
    isLeased: sBoolean().type(),
    registrationNumber: sString().matches(/^[A-Z0-9]{1,7}$/).type(),
}

export const sFee: Fee = {
    amount: sNumber().min(0).type(),
    currency: sEnum<Currency>(Currency).type(),
}

export const models: MyModels = {
    car: {
        name: 'car',
        schema: sCar,
    },
    fee: {
        name: 'fee',
        schema: sFee,
    },
};
