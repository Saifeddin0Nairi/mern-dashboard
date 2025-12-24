const itemService = require('../services/itemService');

const createItem = async (req, res) => {
  const item = await itemService.createItem(req.user._id, req.body);
  res.status(201).json(item);
};

const getItems = async (req, res) => {
  const items = await itemService.getItems(req.user._id, req.query);
  res.json(items);
};

const getItem = async (req, res) => {
  const item = await itemService.getItemById(req.user._id, req.params.id);
  res.json(item);
};

const updateItem = async (req, res) => {
  const item = await itemService.updateItem(req.user._id, req.params.id, req.body);
  res.json(item);
};

const deleteItem = async (req, res) => {
  await itemService.deleteItem(req.user._id, req.params.id);
  res.json({ message: 'Item deleted successfully' });
};

module.exports = { createItem, getItems, getItem, updateItem, deleteItem };
