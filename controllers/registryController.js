const Registry = require('../models/Registry');

// @desc    Get all registry items
// @route   GET /api/registry
// @access  Public
const getRegistry = async (req, res) => {
    try {
        let registry = await Registry.findOne({});
        if (!registry) {
            registry = await Registry.create({ blocks: [], years: [], rooms: [] });
        }
        res.json(registry);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add item to registry
// @route   POST /api/registry/add
// @access  Private/Admin
const addRegistryItem = async (req, res) => {
    try {
        const { type, value } = req.body; // type: 'blocks', 'years', 'rooms'
        let registry = await Registry.findOne({});
        if (!registry) {
            registry = await Registry.create({ blocks: [], years: [], rooms: [] });
        }

        if (registry[type] && !registry[type].includes(value)) {
            registry[type].push(value);
            await registry.save();
        }

        res.json(registry);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Remove item from registry
// @route   POST /api/registry/remove
// @access  Private/Admin
const removeRegistryItem = async (req, res) => {
    try {
        const { type, value } = req.body;
        let registry = await Registry.findOne({});
        if (!registry) return res.status(404).json({ message: 'Registry not found' });

        if (registry[type]) {
            registry[type] = registry[type].filter(item => item !== value);
            await registry.save();
        }

        res.json(registry);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getRegistry,
    addRegistryItem,
    removeRegistryItem
};
