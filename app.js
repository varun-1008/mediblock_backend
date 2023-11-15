const {
  generateKeyPair,
  publicEncrypt,
  privateDecrypt,
  randomBytes,
  scryptSync,
  createCipheriv,
  createDecipheriv,
  createHash,
} = require("crypto");
const express = require("express");
const mongoose = require("mongoose");
const User = require("./models/user");
require('dotenv').config();

const app = express();
app.use(express.json());

const connectToDatabase = async () => {
  try {
    const dbURI = process.env.MONGO_DB_URI;
    await mongoose.connect(dbURI);
    console.log("Connected to the database");
  } catch (error) {
    console.error("Error connecting to the database:", error);
    process.exit(1);
  }
};
connectToDatabase();

let publicKey, privateKey;
let iv = randomBytes(16);

generateKeyPair(
  "rsa",
  {
    modulusLength: 4096,
    publicKeyEncoding: {
      type: "spki",
      format: "pem",
    },
    privateKeyEncoding: {
      type: "pkcs8",
      format: "pem",
    },
  },
  async (err, public, private) => {
    publicKey = public;
    privateKey = private;
    console.log('created');
  }
);

app.post("/generate", (req, res) => {
  const password = req.body.password;

  if (!password)
    res.status(400).json({
      status: "failed",
    });

  const salt = randomBytes(32).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");

  generateKeyPair(
    "rsa",
    {
      modulusLength: 4096,
      publicKeyEncoding: {
        type: "spki",
        format: "pem",
      },
      privateKeyEncoding: {
        type: "pkcs8",
        format: "pem",
      },
    },
    async (err, public, private) => {
      const result = await User.create({
        salt,
        hash,
        public,
        private,
      });

      res.status(201).json({
        status: "success",
        data: {
          public,
        },
      });
    }
  );
});

app.post("/encryptS", (req, res) => {
  const { data } = req.body;

  let key = randomBytes(32);
  let cipher = createCipheriv("aes-256-cbc", key, iv);
  let encryptedData = cipher.update(data, "utf8", "hex");
  encryptedData += cipher.final("hex");

  console.log(key);
  key = key.toString("hex");
  console.log(key);
  console.log(Buffer.from(key, "hex"));

  let hash = createHash("sha256");
  hash.update(key);
  let keyHash = hash.digest("hex");

  res.status(200).json({ encryptedData, key, keyHash });
});

app.post("/decryptS", (req, res) => {
  const { encryptedData, key } = req.body;

  console.log(Buffer.from(key, "hex"));

  let decipher = createDecipheriv("aes-256-cbc", Buffer.from(key, "hex"), iv);
  let decryptedData = decipher.update(encryptedData, "hex", "utf8");
  decryptedData += decipher.final("utf8");

  res.status(200).json({ decryptedData });
});

app.post("/encryptA", (req, res) => {
  const { publicKey, key } = req.body;

  const encryptedKey = publicEncrypt(publicKey, key).toString("hex");
  res.status(200).json({
    encryptedKey,
  });
});

app.post("/decryptA", async (req, res) => {
  const { publicKey, encryptedKey, password } = req.body;

  const user = await User.findOne({ public: publicKey }).exec();

  const newHash = scryptSync(password, user.salt, 64).toString("hex");
  if (newHash !== user.hash) res.status(401).json({ status: "failed" });
  else {
    const key = privateDecrypt(
      user.private,
      Buffer.from(encryptedKey, "hex")
    ).toString("utf8");

    let hash = createHash("sha256");
    hash.update(key);
    let keyHash = hash.digest("hex");

    res.status(200).json({
      key,
      keyHash,
    });
  }
});

app.post("/encryptGA", (req, res) => {
  const { key } = req.body;

  const encryptedKey = publicEncrypt(publicKey, key).toString("hex");
  console.log(encryptedKey);
  res.status(200).json({
    encryptedKey,
  });
});

app.post("/decryptGA", async (req, res) => {
  const { encryptedKey } = req.body;

  const buffer = Buffer.from(encryptedKey, "hex");

  const key = privateDecrypt(
    privateKey,
    buffer
  ).toString("utf8");

  // let key = "sdf";

  res.status(200).json({
    key,
  });
});

const port = process.env.PORT || 8000;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
