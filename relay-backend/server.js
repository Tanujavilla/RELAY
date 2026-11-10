
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
  console.error("Missing Supabase credentials in .env file");
  process.exit(1);
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "RELAY Backend is running with Supabase!" });
});

// Get all activities
app.get("/api/activities", async (req, res) => {
  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .order("id", { ascending: false });

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  res.json(data);
});

// Add activity
app.post("/api/activities", async (req, res) => {
  const { title, member, type } = req.body;

  if (!title || !member || !type) {
    return res.status(400).json({
      message: "Title, member and status are required."
    });
  }

  const activityData = {
    title,
    member,
    type,
    date: new Date().toLocaleDateString()
  };

  const { data, error } = await supabase
    .from("activities")
    .insert([activityData])
    .select()
    .single();

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  res.status(201).json({
    message: "Activity added successfully",
    activity: data
  });
});

// Update activity
app.put("/api/activities/:id", async (req, res) => {
  const id = Number(req.params.id);

  const { data, error } = await supabase
    .from("activities")
    .update(req.body)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  res.json({
    message: "Activity updated successfully",
    activity: data
  });
});

// Delete activity
app.delete("/api/activities/:id", async (req, res) => {
  const id = Number(req.params.id);

  const { data, error } = await supabase
    .from("activities")
    .delete()
    .eq("id", id)
    .select();

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  if (!data || data.length === 0) {
    return res.status(404).json({ message: "Activity not found" });
  }

  res.json({ message: "Activity deleted successfully" });
});

app.listen(PORT, () => {
  console.log(`RELAY Backend running at http://localhost:${PORT}`);
  console.log("Supabase database connection configured.");
});
