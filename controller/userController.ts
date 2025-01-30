import { Request, Response, NextFunction } from "express";
import User, { IContact, IUser } from "../models/userModel"; // Assuming UserDocument is the type exported from userModel
import CustomErrorHandler from "../services/customErrorHandler";
import { param } from "express-validator";
import { Vehicle } from "../models/vechileModel";
import { successResponse } from "../utils/response";
import Review from "../models/reviewModel";

// Interface for User (if not exported from userModel)
// interface User {
//   id: string;
//   name: string;
//   email: string;
//   userType: 'driver' | 'customer'; // Example
//   verified?: boolean;
// }

export const UserController = {
  async getAllUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await User.find({}); // Fetch all users from the database
      res.send(users);
    } catch (err) {
      return next(CustomErrorHandler.serverError("Failed to fetch users."));
    }
  },
  async updateUser(req: Request, res: Response, next: NextFunction) {
    console.log(req.body);
    console.log(req.params.userId);
    console.log(req.file);

    // Validate request body
    // const { error } = updateUserSchema.validate(req.body);

    // if (error) {
    //   return next(error);
    // }
    const profile = req.file?.filename;

    const updateData: any = { ...req.body };
    if (profile) updateData.profile = profile;

    try {
      // Update user information with only the provided fields
      const user = await User.findByIdAndUpdate(req.params.userId, updateData, {
        new: true, // Return the updated document
        // runValidators: true // Run schema validation on the updated data
      });

      if (user) {
        res.status(200).json(user);
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error: any) {
      console.error("Error updating user:", error); // Log error for debugging
      res
        .status(500)
        .json({ message: "Internal Error", originalErr: error.message });
    }
  },

  async getAllDrivers(req: Request, res: Response, next: NextFunction) {
    try {
      const drivers = await User.find({ userType: "driver" });
      
      const driversWithReviews = await Promise.all(
        drivers.map(async (driver) => {
          // Get rating counts
          const ratingCounts = await Review.aggregate([
            {
              $match: {
                toUserId: driver._id,
                reviewType: 'driver'
              }
            },
            {
              $group: {
                _id: '$rating',
                count: { $sum: 1 }
              }
            }
          ]);

          // Calculate average rating
          const totalReviews = ratingCounts.reduce((sum, item) => sum + item.count, 0);
          const totalRating = ratingCounts.reduce((sum, item) => sum + (item._id * item.count), 0);
          const averageRating = totalReviews > 0 ? Number((totalRating / totalReviews).toFixed(1)) : 0;

          // Format rating counts
          const ratings = {
            5: 0, 4: 0, 3: 0, 2: 0, 1: 0,
            ...Object.fromEntries(ratingCounts.map(r => [r._id, r.count]))
          };

          return {
            ...driver.toObject(),
            totalReviews,
            averageRating
          };
        })
      );

      res.send(driversWithReviews);
    } catch (err) {
      return next(CustomErrorHandler.serverError("Failed to fetch drivers."));
    }
  },
  async createContacts(req: Request, res: Response) {
    const { contacts } = req.body; // Expecting an array of contact objects
    const { id } = req.params; // User ID from request parameters

    if (!contacts || !Array.isArray(contacts)) {
      return res
        .status(400)
        .json({ message: "Contacts are required and must be an array." });
    }

    try {
      const user = await User.findById(id); // Find the user by their ID

      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }

      // Ensure the contacts array matches the IContact type
      const contactObjects: IContact[] = contacts.map((contact: any) => ({
        name: contact.name,
        phoneNumber: contact.phoneNumber,
      }));

      user.contacts = contactObjects; // Assign the contact objects to the user's contacts field

      await user.save(); // Save the changes to the database

      res.status(201).json({ message: "Contacts added successfully.", user });
    } catch (error) {
      console.error("Error updating contacts:", error);
      res
        .status(500)
        .json({ message: "An error occurred while updating contacts.", error });
    }
  },
  async getUserContacts(req: Request, res: Response) {
    const { id } = req.params; // Extract the user ID from the request parameters

    try {
      const user = await User.findById(id).select("contacts"); // Find the user and select only the 'contacts' field

      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }

      res.status(200).json({ contacts: user.contacts }); // Send the contacts as a response
    } catch (error) {
      console.error("Error fetching contacts:", error);
      res
        .status(500)
        .json({ message: "An error occurred while fetching contacts.", error });
    }
  },

  async getUser(req: Request, res: Response, next: NextFunction) {
    const { id } = req.query as { id: string }; // Type assertion for req.query

    try {
      const user = await User.findOne({ _id: id });

      if (!user) {
        return next(CustomErrorHandler.notFound("User not found."));
      }

      res.send(user);
    } catch (err) {
      return next(err);
    }
  },

  async getDriver(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params as { id: string }; // Type assertion for req.params

    try {
      const driver = await User.findOne({ _id: id, userType: "driver" });

      if (!driver) {
        return next(CustomErrorHandler.notFound("Driver not found."));
      }

      res.send(driver);
    } catch (err) {
      return next(err);
    }
  },

  async verifyDriver(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params as { id: string }; // Type assertion for req.params

    try {
      const driver = await User.findOneAndUpdate(
        { _id: id, userType: "driver" },
        { verified: 'Approved' },
        { new: true }
      );

      if (!driver) {
        return next(CustomErrorHandler.notFound("Driver not found."));
      }

      res.send({ message: "Driver verified successfully.", driver });
    } catch (err) {
      return next(CustomErrorHandler.serverError("Failed to verify driver."));
    }
  },

  async rejectDriver(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params as { id: string }; // Type assertion for req.params
    try {
      const driver = await User.findOneAndUpdate({ _id: id, userType: "driver" }, { verified: 'Rejected' }, { new: true });
      res.send({ message: "Driver rejected successfully.", driver });
    } catch (err) {
      return next(CustomErrorHandler.serverError("Failed to reject driver."));
    }
  },

  async suspendDriver(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params as { id: string }; // Type assertion for req.params
    try {
      const driver = await User.findOneAndUpdate({ _id: id, userType: "driver" }, { verified: 'Suspended' }, { new: true });
      res.send({ message: "Driver suspended successfully.", driver });
    } catch (err) {
      return next(CustomErrorHandler.serverError("Failed to suspend driver."));
    }
  },
  async getDriverProfile(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;
    const driver = await User.findOne({ _id: id, userType: "driver" });
    if (!driver) return next(CustomErrorHandler.notFound("Driver not found."));
    res.status(200).json(successResponse("Driver profile fetched successfully", driver));
  },
  async updateDriver(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;

    const profile = req.file?.filename;

    const updateData: IUser = { ...req.body };
    if (profile) updateData.profile_image = profile;

    try {
      const driver = await User.findOneAndUpdate(
        { _id: id, userType: "driver" },
        updateData,
        { new: true }
      );

      if (!driver) {
        return next(CustomErrorHandler.notFound("Driver not found."));
      }

      res.send({ message: "Driver details updated successfully.", driver });
    } catch (err) {
      return next(CustomErrorHandler.serverError("Failed to update driver details."));
    }
  },

  async getDriverVehicles(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;
    console.log("id", id);

    const vehicles = await Vehicle.find({ user: id }).populate({
      path: "model",
      populate: [
        {
          path: "category"
        },
        {
          path: "make"
        }
      ]
    });
    console.log("vehicles", vehicles);
    if (!vehicles) {
      return next(CustomErrorHandler.notFound("No vehicles found."));
    }

    res.status(200).json(successResponse("Vehicles fetched successfully", vehicles));
  },

  async changeEarningsType(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;
    const { earnings_type } = req.body;
    const user = await User.findById(id);
    if (!user) return next(CustomErrorHandler.notFound("User not found"));
    user.earnings_type = earnings_type;
    await user.save();
    res.status(200).json(successResponse("Earnings type changed successfully", user));
  }
};
