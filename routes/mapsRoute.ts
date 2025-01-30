import express from 'express';
import { getPlaceAutocomplete } from '../controller/mapsController';

const mapsRoute = express.Router();

// Change from /:query to use query parameter
mapsRoute.get('/autocomplete', getPlaceAutocomplete);

export default mapsRoute;

