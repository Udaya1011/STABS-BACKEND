const Department = require('../models/Department');

// Proactively drop the 'name' unique index if it exists, to allow duplicate names
const dropNameIndex = async () => {
    try {
        await Department.collection.dropIndex('name_1');
        console.log('Successfully dropped unique name index');
    } catch (error) {
        // If index doesn't exist, ignore the error
        if (error.code !== 27) {
            console.log('Unique name index drop status:', error.message);
        }
    }
};
dropNameIndex();

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
        const { name, code, programme, blocks, className, classrooms, academicYears, description } = req.body;

        if (!name || !code) {
            res.status(400);
            return next(new Error('Please provide name and code for the department'));
        }

        // Only enforce uniqueness on the department code; names can be duplicated
        const departmentExists = await Department.findOne({ code });
        if (departmentExists) {
            res.status(400);
            return next(new Error('Department with this code already exists'));
        }

        // Ensure blocks, classrooms and academicYears are arrays (client may send comma‑separated strings)
        const parsedBlocks = typeof blocks === 'string' ? blocks.split(',').map(b => b.trim()).filter(b => b) : blocks;
        const parsedClassrooms = typeof classrooms === 'string' ? classrooms.split(',').map(c => c.trim()).filter(c => c) : classrooms;
        const parsedYears = typeof academicYears === 'string' ? academicYears.split(',').map(y => y.trim()).filter(y => y) : academicYears;
        const parsedClassName = typeof className === 'string' ? className.split(',').map(c => c.trim()).filter(c => c) : className;

        const department = await Department.create({
            name,
            code: code || name.slice(0, 3).toUpperCase(), // Default code if not provided
            programme,
            blocks: parsedBlocks || [],
            className: parsedClassName || [],
            classrooms: parsedClassrooms || [],
            academicYears: parsedYears || [],
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
        const { name, code, programme, blocks, className, classrooms, academicYears, description } = req.body;
        const department = await Department.findById(req.params.id);

        if (!department) {
            res.status(404);
            return next(new Error('Department not found'));
        }

        // No duplicate name check; only code uniqueness is enforced
        // (Name can be used multiple times)

        if (code && code !== department.code) {
            const codeExists = await Department.findOne({ code });
            if (codeExists) {
                res.status(400);
                return next(new Error('Department with this code already exists'));
            }
        }

        // Update fields explicitly
        department.name = name !== undefined ? name : department.name;
        department.code = code !== undefined ? code : department.code;
        department.programme = programme !== undefined ? programme : department.programme;
        department.blocks = blocks !== undefined ? (typeof blocks === 'string' ? blocks.split(',').map(b => b.trim()).filter(b => b) : blocks) : department.blocks;
        department.className = className !== undefined ? (typeof className === 'string' ? className.split(',').map(c => c.trim()).filter(c => c) : className) : department.className;
        department.classrooms = classrooms !== undefined ? (typeof classrooms === 'string' ? classrooms.split(',').map(c => c.trim()).filter(c => c) : classrooms) : department.classrooms;
        department.academicYears = academicYears !== undefined ? (typeof academicYears === 'string' ? academicYears.split(',').map(y => y.trim()).filter(y => y) : academicYears) : department.academicYears;
        department.description = description !== undefined ? description : department.description;

        const updatedDepartment = await department.save();
        console.log(`Updated department: ${updatedDepartment.name}`);
        res.json(updatedDepartment);
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
