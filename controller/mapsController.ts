import { Request, Response, NextFunction } from 'express';
import { getAutoCompleteSuggestions as getPlaceSuggestions } from '../services/googleApiService';


import Joi from 'joi';

const placeAutocompleteSchema = Joi.object({
    input: Joi.string().required().min(3).messages({
        'string.empty': 'Search input cannot be empty',
        'string.min': 'Search input must be at least 1 character long',
        'any.required': 'Search input is required'
    })
});



export const getPlaceAutocomplete = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { error } = placeAutocompleteSchema.validate(req.query);
        if (error) {
            return next(error);
        }
        const { input } = req.query;
        console.log(input);

        const suggestions = await getPlaceSuggestions(input as string);
        console.log(suggestions);
        res.status(200).json(suggestions);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
}