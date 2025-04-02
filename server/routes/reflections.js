const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// Path to the reflections file
const REFLECTIONS_FILE = path.join(__dirname, '../data/reflections.json');

// Ensure the data directory and file exist
async function ensureFileExists() {
  try {
    await fs.access(path.dirname(REFLECTIONS_FILE));
  } catch {
    await fs.mkdir(path.dirname(REFLECTIONS_FILE), { recursive: true });
  }

  try {
    await fs.access(REFLECTIONS_FILE);
  } catch {
    await fs.writeFile(REFLECTIONS_FILE, '[]');
  }
}

// Save a new reflection
router.post('/', async (req, res) => {
  try {
    await ensureFileExists();

    // Read existing reflections
    const data = await fs.readFile(REFLECTIONS_FILE, 'utf8');
    const reflections = JSON.parse(data);

    // Add new reflection
    reflections.push(req.body);

    // Write back to file
    await fs.writeFile(REFLECTIONS_FILE, JSON.stringify(reflections, null, 2));

    res.json({ success: true });
  } catch (error) {
    console.error('Error saving reflection:', error);
    res.status(500).json({ success: false, error: 'Failed to save reflection' });
  }
});

// Get all reflections
router.get('/', async (req, res) => {
  try {
    await ensureFileExists();
    const data = await fs.readFile(REFLECTIONS_FILE, 'utf8');
    res.json({ success: true, reflections: JSON.parse(data) });
  } catch (error) {
    console.error('Error reading reflections:', error);
    res.status(500).json({ success: false, error: 'Failed to read reflections' });
  }
});

module.exports = router; 