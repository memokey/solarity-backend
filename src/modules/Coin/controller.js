import { errorResponse, successResponse } from "../../helpers";

export const getCoins = (req, res) => {
  res.send("in progress");
};

export const addCoin = (req, res) => {
  try {
    const {
      session: { userId },
    } = req;
    let {
      body: { symbol },
    } = req;
    symbol = symbol.toLowerCase();

    return successResponse({ res });
  } catch (err) {
    return errorResponse({ res, err });
  }
};

export const removeCoin = (req, res) => {
  // lower case symbol
  res.send("in progress");
};
