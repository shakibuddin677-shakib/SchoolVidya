import Parent from "../models/parent.model.js";
import Student from "../models/student.model.js";

// create parent (standalone)
export const createParent = async (req, res) => {
  try {
    const { name, email, phone, occupation } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ success: false, message: "Name and phone are required" });
    }

    const newParent = await Parent.create({ name, email, phone, occupation });

    return res.status(201).json({
      success: true,
      message: "Parent created successfully",
      data: newParent,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// get all parents
export const getAllParents = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const totalParents = await Parent.countDocuments();
    const parents = await Parent.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Har Parent ke saath uske linked children (Students) bhi dikhate hain
    const parentsWithChildren = await Promise.all(
      parents.map(async (parent) => {
        const children = await Student.find({ parentId: parent._id }).select("rollNo userId").populate("userId", "name");
        return { ...parent.toObject(), children };
      })
    );

    return res.status(200).json({
      success: true,
      data: parentsWithChildren,
      pagination: { total: totalParents, page, totalPages: Math.ceil(totalParents / limit) },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// update parent
export const updateParent = async (req, res) => {
  try {
    const { name, email, phone, occupation } = req.body;

    const updated = await Parent.findByIdAndUpdate(
      req.params.id,
      { name, email, phone, occupation },
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ success: false, message: "Parent not found" });

    return res.status(200).json({ success: true, message: "Parent updated successfully", data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// delete parent
export const deleteParent = async (req, res) => {
  try {
    // Agar is Parent se koi Student linked hai, delete mat hone do - warna Student ka parentId ek "dangling reference" ban jayega
    const linkedStudent = await Student.findOne({ parentId: req.params.id });
    if (linkedStudent) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete - this parent is linked to a student. Unlink first.",
      });
    }

    const deleted = await Parent.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: "Parent not found" });

    return res.status(200).json({ success: true, message: "Parent deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
