import cartModel from "../model/cart.model.js";
import inventoryModel from "../model/inventory.model.js";
import apiError from "../utils/apiError.js";

export const addToCart = async (req, res, next) => {
  try {
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
      cart.items[itemIndex].quantity = quantity; // update
    } else {
      cart.items.push({ inventoryItem: inventoryItemId, quantity }); // add
    }

    await cart.save();
    res.status(200).json({ message: "Cart updated", cart });
  } catch (error) {
    next(error);
  }
};

export const removeFromCart = async (req, res, next) => {
  try {
    const vendorId = req.user.id;
    const itemId = req.params.itemId;

    const cart = await cartModel.findOne({ vendor: vendorId });

    if (!cart) throw new apiError(404, "Cart not found");

    cart.items = cart.items.filter(
      (item) => item.inventoryItem.toString() !== itemId
    );

    await cart.save();
    res.status(200).json({ message: "Item removed", cart });
  } catch (error) {
    next(error);
  }
};

export const getCart = async (req, res, next) => {
  try {
    const vendorId = req.user.id;

    const cart = await cartModel.findOne({ vendor: vendorId }).populate("items.inventoryItem");

    if (!cart) return res.status(200).json({ items: [] });

    res.status(200).json({ items: cart.items });
  } catch (error) {
    next(error);
  }
};
