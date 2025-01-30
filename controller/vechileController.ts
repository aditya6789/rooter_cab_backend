import { json } from "stream/consumers";
import { Make, Vehicle, VehicleCategory, VehicleModel } from "../models/vechileModel";
import express from "express";

export const getAllMakes = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const makes = await Make.find({});
    res.status(200).json(makes);
  } catch (error) {
    res.status(500).json({ error: "An error occurred while fetching makes." });
  }
};

export const getVehicleModelsByMakeId = async (
  req: express.Request,
  res: express.Response
) => {
  const { id } = req.params;
  console.log(id)
  try {
    const vehicleModels = await VehicleModel.find({ make: id }).populate(
      "make"
    ).populate("category");
    console.log(vehicleModels)
    res.status(200).json(vehicleModels);
  } catch (error) {
    console.log(error)
    res
      .status(500)
      .json({ error: "An error occurred while fetching vehicle models." });
  }
};

// Create a Make
export const createMake = async (
  req: express.Request,
  res: express.Response
) => {
  const { name , vehicleType , logo } = req.body;
  console.log(logo);
  console.log(name);
  console.log(vehicleType);

  

  try {
    const make = new Make({ logo, name , vehicleType });
    await make.save();
    res.status(201).json(make);
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ error: "An error occurred while creating the make." });
  }
};

// Get all Makes
export const getMakes = async (req: express.Request, res: express.Response) => {
  try {
    const makes = await Make.find();
    res.status(200).json(makes);
  } catch (error) {
    res.status(500).json({ error: "An error occurred while fetching makes." });
  }
};

// Get a single Make by ID
export const getMakeById = async (
  req: express.Request,
  res: express.Response
) => {
  const { id } = req.params;
  try {
    const make = await Make.findById(id);
    if (!make) {
      return res.status(404).json({ error: "Make not found" });
    }
    res.status(200).json(make);
  } catch (error) {
    res
      .status(500)
      .json({ error: "An error occurred while fetching the make." });
  }
};

// Update a Make by ID
export const updateMake = async (
  req: express.Request,
  res: express.Response
) => {
  const { id } = req.params;
  const { name } = req.body;
  const logo = req.file?.path;

  try {
    const make = await Make.findByIdAndUpdate(
      id,
      { logo, name },
      { new: true, runValidators: true }
    );
    if (!make) {
      return res.status(404).json({ error: "Make not found" });
    }
    res.status(200).json(make);
  } catch (error) {
    res
      .status(500)
      .json({ error: "An error occurred while updating the make." });
  }
};

// Delete a Make by ID
export const deleteMake = async (
  req: express.Request,
  res: express.Response
) => {
  const { id } = req.params;
  try {
    const make = await Make.findByIdAndDelete(id);
    if (!make) {
      return res.status(404).json({ error: "Make not found" });
    }
    res.status(200).json(make);
  } catch (error) {
    res
      .status(500)
      .json({ error: "An error occurred while deleting the make." });
  }
};

// Create a Vehicle Model
export const createVehicleModel = async (
  req: express.Request,
  res: express.Response
) => {
  const { make, name , category , image } = req.body;


  try {
    const vehicleModel = new VehicleModel({ make, name, image , category , });
    await vehicleModel.save();
    res.status(201).json(vehicleModel);
  } catch (error) {
    console.error("Error creating vehicle model:", error); // Log the full error for debugging
    res
      .status(500)
      .json({ error: "An error occurred while creating the vehicle model." });
  }
};


// Get all Vehicle Models
export const getVehicleModels = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const vehicleModels = await VehicleModel.find().populate("make").populate("category");
    res.status(200).json(vehicleModels);
    console.log(vehicleModels);
  } catch (error) {
    res
      .status(500)
      .json({ error: "An error occurred while fetching vehicle models." });
  }
};

// Get a single Vehicle Model by ID
export const getVehicleModelById = async (
  req: express.Request,
  res: express.Response
) => {
  const { id } = req.params;
  try {
    const vehicleModel = await VehicleModel.findById(id).populate("make");
    if (!vehicleModel) {
      return res.status(404).json({ error: "Vehicle Model not found" });
    }
    res.status(200).json(vehicleModel);
  } catch (error) {
    res
      .status(500)
      .json({ error: "An error occurred while fetching the vehicle model." });
  }
};

// Update a Vehicle Model by ID
export const updateVehicleModel = async (
  req: express.Request,
  res: express.Response
) => {
  const { id } = req.params;
  const { make, name , price } = req.body;
  const image = req.file?.path;

  try {
    const vehicleModel = await VehicleModel.findByIdAndUpdate(
      id,
      { make, name, image , price },
      { new: true, runValidators: true }
    ).populate("make");
    if (!vehicleModel) {
      return res.status(404).json({ error: "Vehicle Model not found" });
    }
    res.status(200).json(vehicleModel);
  } catch (error) {
    res
      .status(500)
      .json({ error: "An error occurred while updating the vehicle model." });
  }
};

// Delete a Vehicle Model by ID
export const deleteVehicleModel = async (
  req: express.Request,
  res: express.Response
) => {
  const { id } = req.params;
  try {
    const vehicleModel = await VehicleModel.findByIdAndDelete(id);
    if (!vehicleModel) {
      return res.status(404).json({ error: "Vehicle Model not found" });
    }
    res.status(200).json(vehicleModel);
  } catch (error) {
    res
      .status(500)
      .json({ error: "An error occurred while deleting the vehicle model." });
  }
};

export const VehicleCategoryController = {
  async createVehicleCategory(req: express.Request, res: express.Response) {
    const { name, capacity , price } = req.body;

    try {
      const vehicle = new VehicleCategory({ name, capacity , price });
      await vehicle.save();
      res.status(201).json(vehicle);
    } catch (error) {
      res
        .status(500)
        .json({ error: "An error occurred while creating the make." });
    }
  },

  async updateVehicleCategory(req: express.Request, res: express.Response) {
    const { id } = req.params;
    const { name, capacity } = req.body;

    try {
      const vehicleCategory = await VehicleCategory.findByIdAndUpdate(
        id,
        { name, capacity },
        { new: true, runValidators: true }
      );
      if (!vehicleCategory) {
        return res.status(404).json({ error: "Vehicle Model not found" });
      }
      res.status(200).json(vehicleCategory);
    } catch (error) {
      res
        .status(500)
        .json({ error: "An error occurred while updating the vehicle model." });
    }
  },

  async deleteVehicleCategory(req: express.Request, res: express.Response) {
    const { id } = req.params;
    try {
      const vehicleCategory = await VehicleCategory.findByIdAndDelete(id);
      if (!vehicleCategory) {
        return res.status(404).json({ error: "Vehicle Model not found" });
      }
      res.status(200).json(vehicleCategory);
    } catch (error) {
      res
        .status(500)
        .json({ error: "An error occurred while deleting the vehicle model." });
    }
  },
  async getAllVehiclecategory(req: express.Request, res: express.Response) {
    try {
      const vehicleCategory = await VehicleCategory.find(); // Ensure await is used here
      res.status(200).json(vehicleCategory);
  } catch (e) {
      console.error("Error fetching vehicle categories:", e);
      res.status(500).json({ error: "An error occurred while fetching vehicle categories." });
  }
  },

  async getDriverVehicleType(req: express.Request, res: express.Response) {
    const { driverId } = req.params;
    const vehicleType = await Vehicle.findOne({ user: driverId })
      .populate({
        path: "model",
        select: "category",
        populate: {
          path: "category",
          select: "name"
        }
      })
      .populate("category", "name");
   if(vehicleType){
    res.status(200).json(vehicleType);
   }else{
    res.status(404).json({ error: "Vehicle not found" });
   }
  }

};
