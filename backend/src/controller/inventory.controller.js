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
    const { includeOutOfStock } = req.query; // Optional query parameter

    if (!category) {
      return res.status(400).json({ message: "Category is required" });
    }

    // Build query - by default, exclude out of stock items
    const query = { category };
    if (includeOutOfStock !== 'true') {
      query.outOfStock = false;
    }

    const items = await inventoryModel.find(query).populate("supplier", "fullname email");

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

// Restock inventory item (add quantity)
export const restockInventory = async (req, res) => {
  try {
    const { inventoryId } = req.params;
    const { additionalQuantity } = req.body;
    const userId = req.user.id;

    if (!additionalQuantity || additionalQuantity <= 0) {
      return res.status(400).json({ message: "Additional quantity must be greater than 0" });
    }

    const inventoryItem = await inventoryModel.findById(inventoryId);

    if (!inventoryItem) {
      return res.status(404).json({ message: "Inventory item not found" });
    }

    if (inventoryItem.supplier.toString() !== userId.toString()) {
      return res.status(403).json({ message: "You are not authorized to restock this inventory item" });
    }

    // Update quantity and stock status
    inventoryItem.quantityAvailable += parseInt(additionalQuantity);
    
    // If item was out of stock, mark as available again
    if (inventoryItem.outOfStock && inventoryItem.quantityAvailable > 0) {
      inventoryItem.outOfStock = false;
    }

    await inventoryItem.save();

    const updatedItem = await inventoryModel.findById(inventoryId).populate("supplier", "fullname email");

    res.status(200).json({
      message: `Inventory restocked successfully. Added ${additionalQuantity} units.`,
      data: updatedItem
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to restock inventory item", error: error.message });
  }
};
