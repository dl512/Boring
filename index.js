import bodyParser from "body-parser";
import express from "express";
import pg from "pg";
import env from "dotenv";

const app = express();
const port = 3000;
env.config();

const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

var currentEvent = "";

async function selectEvent(eventType) {
  const result = await db.query(
    "SELECT activity FROM event WHERE eventtype=$1 AND verified=$2",
    [eventType, "1"]
  );

  var eventList = [];
  for (var i = 0; i < result.rows.length; i++) {
    eventList.push(result.rows[i].activity);
  }
  var randomNum = Math.floor(Math.random() * eventList.length);
  return eventList[randomNum];
}

async function addEvent(newEvent) {
  await db.query("INSERT INTO event (activity) VALUES ($1)", [newEvent]);
}

async function selectAllEvent() {
  const result = await db.query("SELECT * FROM event ORDER BY id");

  var newEventList = [];
  for (var i = 0; i < result.rows.length; i++) {
    newEventList.push(result.rows[i]);
  }
  return newEventList;
}

app.get("/", async (req, res) => {
  res.render("index.ejs", {
    event: currentEvent,
  });
});

app.post("/submit", async (req, res) => {
  currentEvent = await selectEvent(req.body.type);
  res.redirect("/");
});

app.post("/add", async (req, res) => {
  addEvent(req.body.newEvent);
  res.redirect("/");
});

app.get("/admin512", async (req, res) => {
  var allEvents = await selectAllEvent();

  res.render("new.ejs", {
    events: allEvents,
  });
});

app.post("/manage", async (req, res) => {
  if (req.body.verify != null) {
    var selectedId = req.body.verify;
    var selectedType = req.body[selectedId];
    await db.query(
      "UPDATE event SET eventtype = $1, verified = $2 WHERE id = $3",
      [selectedType, "1", selectedId]
    );
  } else if (req.body.delete != null) {
    var selectedId = req.body.delete;
    await db.query("DELETE FROM event WHERE id = $1", [selectedId]);
  } else if (req.body.update != null) {
    var selectedId = req.body.update;
    var selectedType = req.body[selectedId];
    await db.query("UPDATE event SET eventtype = $1 WHERE id = $2", [
      selectedType,
      selectedId,
    ]);
  }
  res.redirect("/admin512");
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
