import cartModel from "../model/cart.model.js";
import inventoryModel from "../model/inventory.model.js";
import ApiResponse from "../utils/APIResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";

export const addToCart = asyncHandler(async (req, res) => {
  const vendorId = req.user.id;
  const { inventoryItemId, quantity } = req.body;

  if (!inventoryItemId || !quantity) {
    throw new apiError(400, "Inventory item and quantity required");
  }

  let cart = await cartModel.findOne({ vendor: vendorId });

  if (!cart) {
    cart = new cartModel({ vendor: vendorId, items: [] });
  }

  const itemIndex = cart.items.findIndex(
    (item) => item.inventoryItem.toString() === inventoryItemId
  );

  if (itemIndex > -1) {
    cart.items[itemIndex].quantity = quantity;
  } else {
    cart.items.push({ inventoryItem: inventoryItemId, quantity });
  }

  await cart.save();

  return res
    .status(201)
    .json(new ApiResponse(201, cart, "Cart updated"));
});

export const removeFromCart = asyncHandler(async (req, res) => {
  const vendorId = req.user.id;
  const itemId = req.params.itemId;

  const cart = await cartModel.findOne({ vendor: vendorId });

  if (!cart) {
    throw new apiError(404, "Cart not found");
  }

  cart.items = cart.items.filter(
    (item) => item.inventoryItem.toString() !== itemId
  );

  await cart.save();

  return res
    .status(200)
    .json(new ApiResponse(200, cart, "Item removed"));
});

export const getCart = asyncHandler(async (req, res) => {
  const vendorId = req.user.id;

  const cart = await cartModel
    .findOne({ vendor: vendorId })
    .populate("items.inventoryItem");

  if (!cart) {
    return res
      .status(200)
      .json(new ApiResponse(200, [], "Cart is empty"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, cart.items, "Cart fetched"));
});
