const Department = require('../models/Department');

// @desc    Get all departments
// @route   GET /api/departments
// @access  Private
const getDepartments = async (req, res) => {
    try {
        const departments = await Department.find({});
        console.log(`Fetched ${departments.length} departments`);
        res.json(departments);
    } catch (error) {
        console.error('Error in getDepartments:', error.message);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a department
// @route   POST /api/departments
// @access  Private/Admin
const createDepartment = async (req, res, next) => {
    try {
        const { name, code, blocks, classrooms, description } = req.body;

        if (!name || !code) {
            res.status(400);
            return next(new Error('Please provide name and code for the department'));
        }

        const departmentExists = await Department.findOne({ $or: [{ code }, { name }] });

        if (departmentExists) {
            res.status(400);
            const message = departmentExists.code === code ? 'Department with this code already exists' : 'Department with this name already exists';
            return next(new Error(message));
        }

        // Ensure blocks and classrooms are arrays (client may send comma‑separated strings)
        const parsedBlocks = typeof blocks === 'string' ? blocks.split(',').map(b => b.trim()).filter(b => b) : blocks;
        const parsedClassrooms = typeof classrooms === 'string' ? classrooms.split(',').map(c => c.trim()).filter(c => c) : classrooms;

        const department = await Department.create({
            name,
            code,
            blocks: parsedBlocks || [],
            classrooms: parsedClassrooms || [],
            description,
        });

        if (department) {
            res.status(201).json(department);
        } else {
            res.status(400);
            return next(new Error('Invalid department data'));
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Update a department
// @route   PUT /api/departments/:id
// @access  Private/Admin
const updateDepartment = async (req, res, next) => {
    try {
        const department = await Department.findById(req.params.id);

        if (department) {
            department.name = req.body.name || department.name;
            department.code = req.body.code || department.code;
            department.blocks = req.body.blocks || department.blocks;
            department.classrooms = req.body.classrooms || department.classrooms;
            department.description = req.body.description || department.description;

            const updatedDepartment = await department.save();
            res.json(updatedDepartment);
        } else {
            res.status(404);
            return next(new Error('Department not found'));
        }
    } catch (error) {
        next(error);
    }
};

const deleteDepartment = async (req, res, next) => {
    try {
        const department = await Department.findById(req.params.id);

        if (department) {
            await department.deleteOne();
            res.json({ message: 'Department removed' });
        } else {
            res.status(404);
            return next(new Error('Department not found'));
        }
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment,
};
