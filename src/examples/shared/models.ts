import { type Model } from '@js20/core';
import { sBoolean, sString } from '@js20/schema';

export interface Car {
    isLeased: boolean;
    registrationNumber: string;
}

export interface MyModels {
    car: Model<Car>;
}

export const sCar: Car = {
    isLeased: sBoolean().type(),
    registrationNumber: sString().matches(/^[A-Z0-9]{1,7}$/).type(),
}

export const models: MyModels = {
    car: {
        name: 'car',
        schema: sCar,
    }
};
