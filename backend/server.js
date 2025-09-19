const express = require("express");
const { exec } = require("child_process");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const warmPool = { python: [], js: [] };
const MAX_POOL_SIZE = 2;

function spawnContainer(lang) {
  const id = uuidv4();
  const image = lang === "python" ? "python:3.11" : "node:18";
  const cmd = `docker run -d --name ${id} ${image} tail -f /dev/null`;

  exec(cmd, (err) => {
    if (err) console.error(`[x] Error spawning ${lang} container: ${err.message}`);
    else console.log(`🚀 Spawned ${lang} container: ${id}`);
  });

  return id;
}

function warmupContainers() {
  ["python", "js"].forEach(lang => {
    for (let i = 0; i < MAX_POOL_SIZE; i++) {
      warmPool[lang].push(spawnContainer(lang));
    }
  });
}

const metrics = [];

function logMetrics(lang, runtime, start, end, error = null) {
  metrics.push({
    lang,
    runtime,
    duration: end - start,
    error: !!error,
    time: new Date().toISOString(),
  });
}

const AUTH_TOKEN = "secure123";

app.post("/execute", async (req, res) => {
  const { code, lang, useGVisor = false, token } = req.body;

  if (token !== AUTH_TOKEN) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const ext = lang === "python" ? "py" : "js";
  const filename = `${uuidv4()}.${ext}`;
  const filepath = path.join(__dirname, "..", "temp", filename);
  const runtime = useGVisor ? "gVisor" : "Docker";

  fs.writeFileSync(filepath, code);

  const container = warmPool[lang]?.pop() || spawnContainer(lang);
  const containerPath = `/tmp/${filename}`;
  const execCmd = lang === "python"
    ? `python3 ${containerPath}`
    : `node ${containerPath}`;

  const start = Date.now();

  exec(`docker cp ${filepath} ${container}:${containerPath}`, (cpErr) => {
    if (cpErr) {
      logMetrics(lang, runtime, start, Date.now(), cpErr);
      return res.status(500).json({ error: "File copy failed" });
    }

    exec(`docker exec ${container} ${execCmd}`, (err, stdout, stderr) => {
      const end = Date.now();
      logMetrics(lang, runtime, start, end, err || stderr);

      if (err || stderr) return res.status(500).json({ error: stderr.trim() });
      return res.json({ output: stdout.trim() });
    });
  });
});

app.get("/metrics", (req, res) => {
  try {
    const summary = {};

    metrics.forEach(m => {
      if (!summary[m.runtime]) {
        summary[m.runtime] = { count: 0, time: 0, errors: 0 };
      }
      summary[m.runtime].count++;
      summary[m.runtime].time += m.duration;
      if (m.error) summary[m.runtime].errors++;
    });

    const report = {};
    for (const runtime in summary) {
      const stats = summary[runtime];
      report[runtime] = {
        totalRequests: stats.count,
        averageTime: stats.count > 0 ? stats.time / stats.count : 0,
        errorRate: stats.count > 0 ? stats.errors / stats.count : 0
      };
    }

    res.json(report);
  } catch (err) {
    res.status(500).json({ error: "Metrics generation failed" });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`✅ Execution engine running on port ${PORT}`);
  warmupContainers();
});
