const express = require("express");
const bodyParser = require("body-parser");
const crypto = require("crypto");

const app = express();
const port = 3000;

app.use(bodyParser.json());

// Function to generate public and private keys
function generateKeyPair() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: "pkcs1",
      format: "pem",
    },
    privateKeyEncoding: {
      type: "pkcs1",
      format: "pem",
    },
  });
  return { publicKey, privateKey };
}

const { publicKey: globalPublicKey, privateKey: globalPrivateKey } =
  generateKeyPair();

// Route to generate and return public and private keys
app.get("/", (req, res) => {
  const { publicKey, privateKey } = generateKeyPair();
  res.json({ publicKey, privateKey });
});

const iv = crypto.randomBytes(16); // Generate random 128-bit IV

// AES encryption
app.post("/encryptS", (req, res) => {
  const data = req.body.data;
  if (!data) {
    return res.status(400).send("Data is required");
  }

  const key = crypto.randomBytes(32); // Generate random 256-bit key
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);

  let encryptedData = cipher.update(data, "utf8", "hex");
  encryptedData += cipher.final("hex");

  res.json({ encryptedData, key: key.toString("hex") });
});

// AES decryption
app.post("/decryptS", (req, res) => {
  const { encryptedData, key } = req.body;
  if (!encryptedData || !key) {
    return res.status(400).send("Encrypted data and key are required");
  }

  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(key, "hex"),
    Buffer.from(iv, "hex")
  );

  let decryptedData = decipher.update(encryptedData, "hex", "utf8");
  decryptedData += decipher.final("utf8");

  res.json({ data: decryptedData });
});

// Function to encrypt data
function encryptData(publicKey, data) {
  const buffer = Buffer.from(data, "utf8");
  const encrypted = crypto.publicEncrypt(publicKey, buffer);
  return encrypted.toString("base64");
}

// Function to decrypt data
function decryptData(privateKey, encryptedData) {
  const buffer = Buffer.from(encryptedData, "base64");
  const decrypted = crypto.privateDecrypt(privateKey, buffer);
  return decrypted.toString("utf8");
}

// Route to encrypt data using public key
app.post("/encryptA", (req, res) => {
  const { publicKey, data } = req.body;
  if (!publicKey || !data) {
    return res.status(400).json({ error: "Public key and data are required" });
  }
  try {
    const encryptedData = encryptData(publicKey, data);
    res.json({ encryptedData });
  } catch (err) {
    res.status(500).json({ error: "Encryption failed", details: err.message });
  }
});

// Route to decrypt data using private key
app.post("/decryptA", (req, res) => {
  const { privateKey, encryptedData } = req.body;
  if (!privateKey || !encryptedData) {
    return res
      .status(400)
      .json({ error: "Private key and encrypted data are required" });
  }
  try {
    const data = decryptData(privateKey, encryptedData);
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: "Decryption failed", details: err.message });
  }
});

// Route to encrypt data using global public key
app.post("/encryptGA", (req, res) => {
  const { data } = req.body;
  if (!data) {
    return res.status(400).json({ error: "Data is required" });
  }
  try {
    const encryptedData = encryptData(globalPublicKey, data);
    res.json({ encryptedData });
  } catch (err) {
    res.status(500).json({ error: "Encryption failed", details: err.message });
  }
});

// Route to decrypt data using global private key
app.post("/decryptGA", (req, res) => {
  const { encryptedData } = req.body;
  if (!encryptedData) {
    return res.status(400).json({ error: "Encrypted data is required" });
  }
  try {
    const data = decryptData(globalPrivateKey, encryptedData);
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: "Decryption failed", details: err.message });
  }
});

app.listen(3000, () => {
  console.log(`Server running on http://localhost:3000`);
});
