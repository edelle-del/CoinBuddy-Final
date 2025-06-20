import { firestore } from "@/config/firebase";
import { NotificationPreferences, ResponseType, UserDataType } from "@/types";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { uploadFileToCloudinary } from "./imageService";

export const updateUser = async (
  uid: string,
  updatedData: UserDataType
): Promise<ResponseType> => {
  try {
    if (updatedData.image && updatedData?.image?.uri) {
      const imageUploadResponse = await uploadFileToCloudinary(
        updatedData.image,
        "users"
      );

      if (!imageUploadResponse.success) {
        return {
          success: false,
          msg: imageUploadResponse.msg || "Failed to upload image",
        };
      }

      updatedData.image = imageUploadResponse.data;
    }

    const userRef = doc(firestore, "users", uid);

    // Update the user document with the provided updatedData
    await updateDoc(userRef, updatedData);

    // Fetch the updated user data
    const updatedUserDoc = await getDoc(userRef);

    return {
      success: true,
      msg: "Updated successfully",
    };

    // if (updatedUserDoc.exists()) {
    //   return {
    //     success: true,
    //     data: updatedUserDoc.data(),
    //   };
    // } else {
    //   return {
    //     success: false,
    //     msg: "User not found",
    //   };
    // }
  } catch (error: any) {
    console.error("Error updating user:", error);
    return {
      success: false,
      msg: error.message,
    };
  }
};

export const updateNotificationPreferences = async (
  uid: string,
  preferences: NotificationPreferences
): Promise<ResponseType> => {
  try {
    const userRef = doc(firestore, "users", uid);
    
    // Update only the notification preferences
    await updateDoc(userRef, {
      notificationPreferences: preferences
    });

    return {
      success: true,
      msg: "Notification preferences updated successfully",
    };
  } catch (error: any) {
    console.error("Error updating notification preferences:", error);
    return {
      success: false,
      msg: error.message || "Failed to update notification preferences",
    };
  }
};

export const getNotificationPreferences = async (
  uid: string
): Promise<ResponseType> => {
  try {
    const userRef = doc(firestore, "users", uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return {
        success: false,
        msg: "User not found",
      };
    }

    const userData = userDoc.data();
    const notificationPreferences = userData.notificationPreferences || {
      emailAlerts: false,
      appPushNotifications: true,
    };

    return {
      success: true,
      data: notificationPreferences,
    };
  }
  catch (error: any) {
    console.error("Error getting notification preferences:", error);
    return {
      success: false,
      msg: error.message || "Failed to get notification preferences",
    };
  }
};
