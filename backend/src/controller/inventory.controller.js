import inventoryModel from "../model/inventory.model.js";
import ApiResponse from "../utils/APIResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";

export const addInventory = asyncHandler(async (req, res) => {
  const { name, description, price, quantityAvailable, category } = req.body;

  if (!name || !price || !quantityAvailable || !category) {
    throw new apiError(400, "All fields are required");
  }

  const newItem = new inventoryModel({
    name,
    description,
    price,
    quantityAvailable,
    category,
    supplier: req.user.id
  });

  await newItem.save();

  return res.status(201).json(
    new ApiResponse(201, newItem, "Inventory item added successfully")
  );
});

export const getInventoryByCategory = asyncHandler(async (req, res) => {
  const { category } = req.params;
  const { includeOutOfStock } = req.query;

  if (!category) {
    throw new apiError(400, "Category is required");
  }

  const query = { category };
  if (includeOutOfStock !== "true") {
    query.outOfStock = false;
  }

  const items = await inventoryModel
    .find(query)
    .populate("supplier", "fullname email");

  return res.status(200).json(
    new ApiResponse(200, items, `Items in category: ${category}`)
  );
});

export const updateInventory = asyncHandler(async (req, res) => {
  const { inventoryId } = req.params;
  const userId = req.user.id;

  const inventoryItem = await inventoryModel.findById(inventoryId);

  if (!inventoryItem) {
    throw new apiError(404, "Inventory item not found");
  }

  if (inventoryItem.supplier.toString() !== userId.toString()) {
    throw new apiError(403, "You are not authorized to update this inventory item");
  }

  const updatedItem = await inventoryModel
    .findByIdAndUpdate(inventoryId, req.body, {
      new: true,
      runValidators: true
    })
    .populate("supplier", "fullname email");

  return res.status(200).json(
    new ApiResponse(200, updatedItem, "Inventory item updated successfully")
  );
});


export const deleteInventory = asyncHandler(async (req, res) => {
  const { inventoryId } = req.params;
  const userId = req.user.id;

  const inventoryItem = await inventoryModel.findById(inventoryId);

  if (!inventoryItem) {
    throw new apiError(404, "Inventory item not found");
  }

  if (inventoryItem.supplier.toString() !== userId.toString()) {
    throw new apiError(403, "You are not authorized to delete this inventory item");
  }

  await inventoryModel.findByIdAndDelete(inventoryId);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Inventory item deleted successfully"));
});

export const restockInventory = asyncHandler(async (req, res) => {
  const { inventoryId } = req.params;
  const { additionalQuantity } = req.body;
  const userId = req.user.id;

  if (!additionalQuantity || additionalQuantity <= 0) {
    throw new apiError(400, "Additional quantity must be greater than 0");
  }

  const inventoryItem = await inventoryModel.findById(inventoryId);

  if (!inventoryItem) {
    throw new apiError(404, "Inventory item not found");
  }

  if (inventoryItem.supplier.toString() !== userId.toString()) {
    throw new apiError(403, "You are not authorized to restock this inventory item");
  }

  inventoryItem.quantityAvailable += parseInt(additionalQuantity);

  if (inventoryItem.outOfStock && inventoryItem.quantityAvailable > 0) {
    inventoryItem.outOfStock = false;
  }

  await inventoryItem.save();

  const updatedItem = await inventoryModel
    .findById(inventoryId)
    .populate("supplier", "fullname email");

  return res.status(200).json(
    new ApiResponse(
      200,
      updatedItem,
      `Inventory restocked successfully. Added ${additionalQuantity} units.`
    )
  );
});