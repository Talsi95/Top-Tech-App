const Repair = require('../models/repair');

// Create a new repair entry (Admin only)
exports.createRepair = async (req, res) => {
    try {
        const { customerName, phoneNumber, deviceModel, repairType } = req.body;
        
        if (!customerName || !phoneNumber || !deviceModel || !repairType) {
            return res.status(400).json({ message: 'כל השדות (שם, טלפון, דגם מכשיר, סוג תיקון) חובה' });
        }

        const newRepair = new Repair({
            customerName,
            phoneNumber,
            deviceModel,
            repairType,
            status: 'בתיקון'
        });

        await newRepair.save();
        res.status(201).json({ message: 'תיקון נפתח בהצלחה', repair: newRepair });
    } catch (error) {
        console.error('Error creating repair:', error);
        res.status(500).json({ message: 'שגיאה ביצירת תיקון', error: error.message });
    }
};

// Get all repairs (Admin only)
exports.getAllRepairs = async (req, res) => {
    try {
        const repairs = await Repair.find().sort({ createdAt: -1 });
        res.status(200).json(repairs);
    } catch (error) {
        console.error('Error fetching repairs:', error);
        res.status(500).json({ message: 'שגיאה בשליפת התיקונים', error: error.message });
    }
};

// Update repair status (Admin only)
exports.updateRepairStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['בתיקון', 'מוכן'].includes(status)) {
            return res.status(400).json({ message: 'סטטוס לא חוקי' });
        }

        const updatedRepair = await Repair.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

        if (!updatedRepair) {
            return res.status(404).json({ message: 'תיקון לא נמצא' });
        }

        res.status(200).json({ message: 'סטטוס עודכן בהצלחה', repair: updatedRepair });
    } catch (error) {
        console.error('Error updating repair status:', error);
        res.status(500).json({ message: 'שגיאה בעדכון הסטטוס', error: error.message });
    }
};

// Check repair status by phone (Public)
exports.getRepairStatusByPhone = async (req, res) => {
    try {
        const { phone } = req.params;

        if (!phone) {
            return res.status(400).json({ message: 'מספר טלפון חסר' });
        }

        // Find active repairs
        const repairs = await Repair.find({ phoneNumber: phone }).sort({ createdAt: -1 });

        if (repairs.length === 0) {
            return res.status(404).json({ message: 'לא נמצאו תיקונים למספר זה' });
        }

        res.status(200).json(repairs);
    } catch (error) {
        console.error('Error fetching repair status:', error);
        res.status(500).json({ message: 'שגיאה בבדיקת הסטטוס', error: error.message });
    }
};
