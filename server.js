const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, "attendees.json");

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ---------- helpers ----------
function readAttendees() {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    return raw.trim() ? JSON.parse(raw) : [];
  } catch (err) {
    return [];
  }
}

function writeAttendees(list) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2));
}

// ---------- routes ----------
// GET /attendees
app.get("/attendees", (req, res) => {
  res.json(readAttendees());
});

// POST /attendees
app.post("/attendees", (req, res) => {
  const { name, event, ticketType, ticketPrice } = req.body;
  const price = Number(ticketPrice);

  if (!name || !event || !ticketType || ticketPrice === "" || ticketPrice === undefined) {
    return res.status(400).json({ error: "All fields are required" });
  }
  if (Number.isNaN(price) || price < 0) {
    return res.status(400).json({ error: "ticketPrice must be a non-negative number" });
  }

  const attendees = readAttendees();
  const nextId = attendees.length ? Math.max(...attendees.map((a) => a.id)) + 1 : 1;
  const newAttendee = {
    id: nextId,
    name: String(name).trim(),
    event: String(event).trim(),
    ticketType: String(ticketType).trim(),
    ticketPrice: price,
  };

  writeAttendees([...attendees, newAttendee]);
  res.status(201).json(newAttendee);
});

// DELETE /attendees/:id
app.delete("/attendees/:id", (req, res) => {
  const id = Number(req.params.id);
  const attendees = readAttendees();
  const exists = attendees.some((a) => a.id === id);

  if (!exists) {
    return res.status(404).json({ error: "Attendee not found" });
  }

  writeAttendees(attendees.filter((a) => a.id !== id));
  res.json({ message: "Attendee deleted", id });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
