import {
  successResponse,
  errorResponse,
  throwError,
  verifySignature,
} from "../../helpers";
import UserModel from "../User/model";
import md5 from "md5";
import {
  getProfileData,
  validateTwitterUsername,
  saveOwnedNfts,
} from "./helpers";
import _ from "lodash";
import { Promise } from "bluebird";
import { validatePassword } from "../../helpers/authHelpers";
import { isValidSolanaAddress } from "@nfteyez/sol-rayz";
import axios from "axios";

// OK
export const getProfileController = async (req, res) => {
  try {
    const { userId } = req.session;
    const profile = await getProfileData(userId);
    if (!profile) {
      await res.session.destroy();
      throwError("Invalid Credentials");
    }
    return successResponse({ res, response: { profile } });
  } catch (err) {
    return errorResponse({ res, err });
  }
};

// OK
export const updateProfileController = async (req, res) => {
  try {
    const {
      session: { userId },
      body,
    } = req;
    const user = await UserModel.findById(userId);
    const updateObject = {};
    const checkIfExists = async (key) => {
      if (!updateObject[key] || updateObject[key] === user[key]) return false;
      const existing = await UserModel.findOne({
        [key]: body[key].toLowerCase(),
      });
      if (existing)
        throwError(`User with the provided '${key}' already exists`);
      return false;
    };
    const newVal = (key) => body[key] || user[key] || "";
    const formatForId = (value) => {
      if (typeof value === "string") {
        return value.toLowerCase().replace(/\s+/g, "");
      }
      return undefined;
    };
    // FORMAT FULLNAME
    updateObject.fullName = newVal("fullName");
    if (updateObject.fullName) {
      updateObject.fullName = updateObject.fullName
        .replace(/  +/g, " ")
        .split(" ")
        .map((val) => _.capitalize(val))
        .join(" ");
    }

    // FORMAT USERNAME
    updateObject.username = formatForId(newVal("username"));
    // FORMAT BIO
    updateObject.bio = newVal("bio");
    if (updateObject.bio) {
      updateObject.bio = updateObject.bio.replace(/  +/g, " ");
    }

    // FORMAT EMAIL
    updateObject.email = formatForId(newVal("email"));
    // FORMAT GITHUBUSERNAME
    updateObject.githubUsername = formatForId(newVal("githubUsername"));

    // FORMAT DISCORDHANDLE
    updateObject.discordHandle = formatForId(newVal("discordHandle"));

    // FORMAT TWITTERUSERNAME
    updateObject.twitterUsername = formatForId(newVal("twitterUsername"));

    // REMOVE EMPTY
    Object.keys(updateObject).forEach((key) => {
      if (updateObject[key] === user[key] || !updateObject[key])
        delete updateObject[key];
    });

    // TWITTER USERNAME OWNERSHIP VALIDATION
    if (
      updateObject.twitterUsername &&
      updateObject.twitterUsername !== user.twitterUsername
    ) {
      // const twitterInfo = await validateTwitterUsername(
      //   req,
      //   updateObject.twitterUsername
      // );
      // const {
      //   data: { id: twitterId },
      // } = twitterInfo;
      updateObject.twitterId = undefined;
    }

    // check if any of the unique data is in use
    const valueChecks = [
      "username",
      "email",
      "githubUsername",
      "discordHandle",
      "twitterUsername",
    ];
    await Promise.each(valueChecks, async (value) => {
      await checkIfExists(value);
    });

    await UserModel.updateOne(
      { _id: userId },
      { ...updateObject, profileCompleted: true }
    );
    const userData = await getProfileData(userId);

    return successResponse({ res, response: { profile: userData } });
  } catch (err) {
    return errorResponse({ res, err });
  }
};

export const claimProfitDaoController = async (req, res) => {
  try {
    const {
      session: { userId },
    } = req;
    await UserModel.updateOne({ _id: userId }, { daoClaimed: true });
    const profile = await getProfileData(userId);
    return successResponse({ res, response: { profile } });
  } catch (err) {
    return errorResponse({ res, err });
  }
};

// OK
export const updatePasswordController = async (req, res) => {
  try {
    const {
      body: { newPassword, currentPassword },
      session: { userId },
    } = req;
    const user = await UserModel.findById(userId);
    const { password } = user;
    if (password != md5(currentPassword)) {
      throwError("The provided current password is invalid");
    }
    const [error, errorMessage] = validatePassword(password);
    if (error) throwError(errorMessage);
    await UserModel.updateOne({ _id: userId }, { password: md5(newPassword) });
    return successResponse({ res });
  } catch (err) {
    return errorResponse({ res, err });
  }
};

//OK
export const updateProfileImageController = async (req, res) => {
  try {
    const profileImageLink = req.file.location;
    const { userId } = req.session;
    await UserModel.updateOne({ _id: userId }, { profileImageLink });
    return successResponse({ res, response: { profileImageLink } });
  } catch (err) {
    return errorResponse({
      res,
      err,
      message: "Image was not uploaded",
    });
  }
};

export const updatePublicAddressController = async (req, res) => {
  try {
    const { userId } = req.session;
    const { publicAddress, signedUserId } = req.body;
    if (!isValidSolanaAddress(publicAddress))
      throwError("Invalid public address");
    const verified = verifySignature(userId, signedUserId, publicAddress);
    if (!verified) throw false;
    await UserModel.updateOne({ _id: userId }, { publicAddress });
    await saveOwnedNfts(publicAddress);
    return successResponse({ res });
  } catch (err) {
    return errorResponse({
      res,
      err,
      message: "Unable to verify the public address",
    });
  }
};

export const updateProfileImageFromNftController = async (req, res) => {
  try {
    const {
      body: { mint },
      session: { userId },
    } = req;
    const { data: nftDetails } = await axios.get(
      `https://api-mainnet.magiceden.dev/v2/tokens/${mint}`
    );
    await UserModel.updateOne(
      { _id: userId },
      { profileImageLink: nftDetails.image }
    );
    const profile = await getProfileData(userId);
    return successResponse({ res, response: { profile } });
  } catch (err) {
    return errorResponse({ res, err });
  }
};
