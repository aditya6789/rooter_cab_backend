import express from 'express';
import {  getDriverEarnings } from '../controller/driverEarningsController';

const driverearningsRoute = express.Router();


// Route to get driver earnings
driverearningsRoute.get('/:driverId', getDriverEarnings);

export default driverearningsRoute;
