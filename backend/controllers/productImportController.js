const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { productImportQueue } = require('../services/productImportQueue');

// Configure Multer for temp storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '..', 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, `import-${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ 
    storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
            file.mimetype === 'text/csv' ||
            file.originalname.match(/\.(xlsx|csv)$/)) {
            cb(null, true);
        } else {
            cb(new Error('Only XLSX and CSV files are allowed!'), false);
        }
    }
});

const importProducts = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Please upload an Excel or CSV file' });
        }

        const storeId = req.store._id || req.user.storeId; // Adjust based on your auth logic

        if (!storeId) {
             // Clean up if no storeId
             fs.unlinkSync(req.file.path);
             return res.status(403).json({ error: 'Store ID not found in token' });
        }

        // Add job to BullMQ
        const job = await productImportQueue.add('product-import-job', {
            filePath: req.file.path,
            storeId: storeId.toString()
        });

        res.status(202).json({
            message: 'File uploaded successfully. Processing started.',
            status: 'processing',
            jobId: job.id
        });

    } catch (error) {
        console.error('Import Controller Error:', error);
        res.status(500).json({ error: 'Failed to process import request' });
    }
};

const getImportStatus = async (req, res) => {
    try {
        const { jobId } = req.params;
        const job = await productImportQueue.getJob(jobId);

        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        const state = await job.getState();
        const progress = job.progress;
        const result = job.returnvalue;
        const failedReason = job.failedReason;

        res.status(200).json({
            id: job.id,
            state,
            progress,
            result,
            failedReason
        });
    } catch (error) {
        console.error('Import Status Error:', error);
        res.status(500).json({ error: 'Failed to fetch job status' });
    }
};

module.exports = {
    upload,
    importProducts,
    getImportStatus
};
