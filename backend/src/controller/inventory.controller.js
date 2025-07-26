import inventoryModel from "../model/inventory.model.js";

export const addInventory = async (req, res) => {
  try {
    const { name, description, price, quantityAvailable, category } = req.body;

    if (!name || !price || !quantityAvailable || !category) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const newItem = new inventoryModel({
      name,
      description,
      price,
      quantityAvailable,
      category,
      supplier: req.user.id // Using 'supplier' to match your model schema
    });

    await newItem.save();

    res.status(201).json({
      message: "Inventory item added successfully",
      data: newItem
    });
  } catch (error) {
    res.status(500).json({
      message: "Something went wrong",
      error: error.message
    });
  }
};

export const getInventoryByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    if (!category) {
      return res.status(400).json({ message: "Category is required" });
    }

    const items = await inventoryModel.find({ category }).populate("supplier", "fullname email");

    res.status(200).json({
      message: `Items in category: ${category}`,
      data: items
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch items",
      error: error.message
    });
  }
};

export const updateInventory = async (req, res) => {
  try {
    const { inventoryId } = req.params;
    const userId = req.user.id;

    const inventoryItem = await inventoryModel.findById(inventoryId);

    if (!inventoryItem) {
      return res.status(404).json({ message: "Inventory item not found" });
    }

    if (inventoryItem.supplier.toString() !== userId.toString()) {
      return res.status(403).json({ message: "You are not authorized to update this inventory item" });
    }

    const updatedItem = await inventoryModel.findByIdAndUpdate(
      inventoryId,
      req.body,
      { new: true, runValidators: true }
    ).populate("supplier", "fullname email");

    res.status(200).json({
      message: "Inventory item updated successfully",
      data: updatedItem
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to update inventory item", error: error.message });
  }
};

export const deleteInventory = async (req, res) => {
  try {
    const { inventoryId } = req.params;
    const userId = req.user.id;

    const inventoryItem = await inventoryModel.findById(inventoryId);

    if (!inventoryItem) {
      return res.status(404).json({ message: "Inventory item not found" });
    }

    if (inventoryItem.supplier.toString() !== userId.toString()) {
      return res.status(403).json({ message: "You are not authorized to delete this inventory item" });
    }

    await inventoryModel.findByIdAndDelete(inventoryId);

    res.status(200).json({ message: "Inventory item deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete inventory item", error: error.message });
  }
};
