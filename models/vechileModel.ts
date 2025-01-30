import { required } from "joi";
import mongoose, { mongo, ObjectId } from "mongoose";

const makeSchema = new mongoose.Schema({
  logo: {
    type: String,
    required: true,
  },
  name: {
    type: String,
  },
  vehicleType:{
    type: String,
    enum: ["cab", "bike"],
    required: true,
    default: "cab",

  },
});

export interface IVehicleModel extends  Document{
  make : ObjectId;
  name:string;
  image:string;
  category:ObjectId;
}

const vehicleModelSchema = new mongoose.Schema({
  make: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Make",
  },
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "VehicleCategory",
  },
});
const vehicleCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  capacity: {
    type: String,
    required: true,
  },
  price:{
    type:String,
    required:true,
  }
});

export interface IVehicle extends Document {
  model: ObjectId;
  user: ObjectId;
  category: ObjectId;
  vehicle_number: string;
}

const vehicleSchema = new mongoose.Schema({
  // make: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: "Make",
  // },
  vehicle_number: {
    type: String,
    required: true,
  },
  model: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "VehicleModel",
  },
 
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "VehicleCategory",
  },

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

export const Make = mongoose.model("Make", makeSchema);
export const VehicleModel = mongoose.model<IVehicleModel>("VehicleModel", vehicleModelSchema);
export const Vehicle = mongoose.model<IVehicle>("Vehicle", vehicleSchema);
export const VehicleCategory = mongoose.model(
  "VehicleCategory",
  vehicleCategorySchema
);
