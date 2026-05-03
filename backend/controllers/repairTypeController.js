const RepairType = require('../models/repairType');

// Get all repair types (Public & Admin)
exports.getAllRepairTypes = async (req, res) => {
    try {
        const repairTypes = await RepairType.find().sort({ createdAt: -1 });
        res.status(200).json(repairTypes);
    } catch (error) {
        console.error('Error fetching repair types:', error);
        res.status(500).json({ message: 'שגיאה בשליפת סוגי התיקונים', error: error.message });
    }
};

// Create a new repair type (Admin only)
exports.createRepairType = async (req, res) => {
    try {
        const { name, price, description, stock } = req.body;
        
        if (!name || !price) {
            return res.status(400).json({ message: 'שם ומחיר הם שדות חובה' });
        }

        const newRepairType = new RepairType({
            name,
            price,
            description,
            stock: stock !== undefined ? stock : 0
        });

        await newRepairType.save();
        res.status(201).json({ message: 'סוג תיקון נוצר בהצלחה', repairType: newRepairType });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'סוג תיקון בשם זה כבר קיים' });
        }
        console.error('Error creating repair type:', error);
        res.status(500).json({ message: 'שגיאה ביצירת סוג תיקון', error: error.message });
    }
};

// Update a repair type (Admin only)
exports.updateRepairType = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, price, description, stock } = req.body;

        const updatedRepairType = await RepairType.findByIdAndUpdate(
            id,
            { name, price, description, stock },
            { new: true, runValidators: true }
        );

        if (!updatedRepairType) {
            return res.status(404).json({ message: 'סוג תיקון לא נמצא' });
        }

        res.status(200).json({ message: 'סוג תיקון עודכן בהצלחה', repairType: updatedRepairType });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'סוג תיקון בשם זה כבר קיים' });
        }
        console.error('Error updating repair type:', error);
        res.status(500).json({ message: 'שגיאה בעדכון סוג תיקון', error: error.message });
    }
};

// Delete a repair type (Admin only)
exports.deleteRepairType = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedRepairType = await RepairType.findByIdAndDelete(id);

        if (!deletedRepairType) {
            return res.status(404).json({ message: 'סוג תיקון לא נמצא' });
        }

        res.status(200).json({ message: 'סוג תיקון נמחק בהצלחה' });
    } catch (error) {
        console.error('Error deleting repair type:', error);
        res.status(500).json({ message: 'שגיאה במחיקת סוג תיקון', error: error.message });
    }
};
