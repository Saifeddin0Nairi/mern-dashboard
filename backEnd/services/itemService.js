const Item = require('../models/Item');

const createItem = async (userId, data) => {
  const { title, description, status } = data;
  const item = new Item({
    user: userId,
    title,
    description: description || '',
    status: status || 'todo'
  });
  await item.save();
  return item;
};

const getItems = async (userId, query) => {
  let { page, limit, status } = query;
  page = page ? parseInt(page) : 1;
  limit = limit ? parseInt(limit) : 10;
  if (isNaN(page) || page < 1) page = 1;
  if (isNaN(limit) || limit < 1) limit = 10;
  const filter = { user: userId };
  if (status) {
    filter.status = status;
  }
  const skip = (page - 1) * limit;
  const items = await Item.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
  return items;
};

const getItemById = async (userId, itemId) => {
  const item = await Item.findOne({ _id: itemId, user: userId });
  if (!item) {
    const err = new Error('Item not found');
    err.statusCode = 404;
    throw err;
  }
  return item;
};

const updateItem = async (userId, itemId, data) => {
  // Filter allowed fields
  const allowedFields = ['title', 'description', 'status'];
  const updateData = {};
  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      updateData[field] = data[field];
    }
  }
  if (Object.keys(updateData).length === 0) {
    const err = new Error('No item fields provided for update');
    err.statusCode = 400;
    throw err;
  }
  const item = await Item.findOneAndUpdate(
    { _id: itemId, user: userId },
    updateData,
    { new: true, runValidators: true }
  );
  if (!item) {
    const err = new Error('Item not found');
    err.statusCode = 404;
    throw err;
  }
  return item;
};

const deleteItem = async (userId, itemId) => {
  const item = await Item.findOneAndDelete({ _id: itemId, user: userId });
  if (!item) {
    const err = new Error('Item not found');
    err.statusCode = 404;
    throw err;
  }
};

module.exports = { createItem, getItems, getItemById, updateItem, deleteItem };
