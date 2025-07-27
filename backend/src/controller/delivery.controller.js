import Delivery from "../model/delivery.model.js";
import Order from "../model/order.model.js";

// Assign delivery partner to order
export const assignDelivery = async (req, res) => {
  try {
    const { orderId, deliveryPartnerId, estimatedDeliveryTime } = req.body;

    // Check if order exists and is ready for delivery
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.orderStatus !== 'ready_for_pickup') {
      return res.status(400).json({ 
        message: "Order is not ready for pickup" 
      });
    }

    // Create delivery record
    const delivery = new Delivery({
      orderId,
      deliveryPartner: deliveryPartnerId,
      customerAddress: order.deliveryAddress,
      pickupAddress: {
        // This would typically come from supplier/store address
        addressLine1: "Store Address",
        city: "Store City",
        state: "Store State",
        pincode: "123456"
      },
      estimatedDeliveryTime: estimatedDeliveryTime || new Date(Date.now() + 30 * 60000), // 30 mins default
      deliveryFee: order.deliveryFee
    });

    await delivery.save();

    // Update order status
    order.orderStatus = 'assigned_delivery';
    order.statusHistory.push({
      status: 'assigned_delivery',
      timestamp: new Date(),
      note: `Assigned to delivery partner`
    });
    await order.save();

    res.status(201).json({
      message: "Delivery assigned successfully",
      data: delivery
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to assign delivery",
      error: error.message
    });
  }
};

// Update delivery status
export const updateDeliveryStatus = async (req, res) => {
  try {
    const { deliveryId } = req.params;
    const { status, location, note } = req.body;

    const delivery = await Delivery.findById(deliveryId);
    if (!delivery) {
      return res.status(404).json({ message: "Delivery not found" });
    }

    // Update delivery status
    delivery.status = status;
    
    // Update current location if provided
    if (location) {
      delivery.currentLocation = {
        latitude: location.latitude,
        longitude: location.longitude,
        lastUpdated: new Date()
      };
    }

    // Add to timeline
    delivery.timeline.push({
      status,
      timestamp: new Date(),
      location: location || null,
      note: note || ''
    });

    // If delivered, set actual delivery time
    if (status === 'delivered') {
      delivery.actualDeliveryTime = new Date();
    }

    await delivery.save();

    // Update corresponding order status
    const order = await Order.findById(delivery.orderId);
    if (order) {
      let orderStatus = status;
      
      // Map delivery status to order status
      if (status === 'picked_up') orderStatus = 'picked_up';
      if (status === 'on_the_way') orderStatus = 'on_delivery';
      if (status === 'delivered') orderStatus = 'delivered';
      
      order.orderStatus = orderStatus;
      order.statusHistory.push({
        status: orderStatus,
        timestamp: new Date(),
        note: note || `Delivery ${status}`
      });

      if (status === 'delivered') {
        order.actualDeliveryTime = new Date();
      }

      await order.save();
    }

    res.status(200).json({
      message: "Delivery status updated",
      data: delivery
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update delivery status",
      error: error.message
    });
  }
};

// Get delivery details
export const getDeliveryDetails = async (req, res) => {
  try {
    const { deliveryId } = req.params;

    const delivery = await Delivery.findById(deliveryId)
      .populate('orderId')
      .populate('deliveryPartner', 'fullname phone');

    if (!delivery) {
      return res.status(404).json({ message: "Delivery not found" });
    }

    res.status(200).json({
      message: "Delivery details",
      data: delivery
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get delivery details",
      error: error.message
    });
  }
};

// Track delivery (for customers)
export const trackDelivery = async (req, res) => {
  try {
    const { orderId } = req.params;

    const delivery = await Delivery.findOne({ orderId })
      .populate('deliveryPartner', 'fullname phone')
      .select('-timeline'); // Exclude detailed timeline for customer view

    if (!delivery) {
      return res.status(404).json({ message: "Delivery not found" });
    }

    // Calculate estimated time remaining
    const now = new Date();
    const estimatedTimeRemaining = Math.max(0, 
      Math.floor((delivery.estimatedDeliveryTime - now) / (1000 * 60))
    );

    res.status(200).json({
      message: "Delivery tracking",
      data: {
        status: delivery.status,
        estimatedDeliveryTime: delivery.estimatedDeliveryTime,
        estimatedTimeRemaining: `${estimatedTimeRemaining} minutes`,
        currentLocation: delivery.currentLocation,
        deliveryPartner: delivery.deliveryPartner,
        deliveryInstructions: delivery.deliveryInstructions
      }
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to track delivery",
      error: error.message
    });
  }
};

// Get deliveries for delivery partner
export const getPartnerDeliveries = async (req, res) => {
  try {
    const partnerId = req.user.id;
    const { status = 'all' } = req.query;

    let filter = { deliveryPartner: partnerId };
    if (status !== 'all') {
      filter.status = status;
    }

    const deliveries = await Delivery.find(filter)
      .populate('orderId', 'items totalAmount')
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Partner deliveries",
      data: deliveries
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get partner deliveries",
      error: error.message
    });
  }
};
