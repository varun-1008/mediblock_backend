const express = require('express');
const app = express();

app.get("/", (req, res) => {
  res.send("hii");
})

/*
Generate keys
input: password
output: public key

generate a key pair, store the password along with the key
*/

app.get("/generate", (req, res) => {
  
})

const port = process.env.PORT || 8000;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});

