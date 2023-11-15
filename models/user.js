const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  salt: {
    type: String,
    required: [true, 'Must have a unique salt'],
    trim: true,
  },
  hash: {
    type: String,
    required: [true, ' Must have a hash'],
    trim: true,
  },
  public: {
    type: String,
    required: [true, ' Must have public key'],
    trim: true,
  },
  private: {
    type: String,
    required: [true, ' Must have a private key'],
    trim: true,
  }
});

//HOOKs
// pasteSchema.pre('save',function(next){
//   if(this.expiresAt) return next();
//   this.expiresAt = new Date('2100');
//   next();
// })

// pasteSchema.pre('save',async function(next){
//   if(!this.password || !this.isModified('password')) return next();
//   this.password = await bcrypt.hash(this.password,12);
//   next();
// })

// pasteSchema.pre(/^find/, function(next){
//   //this points to the current query
//   this.find({expiresAt: {$gt: new Date(Date.now())}});
//   next();
// })

// //INSTANCE METHODS
// pasteSchema.methods.correctPassword = async function(candidatePassword, pastePassword){
//   return await bcrypt.compare(candidatePassword,pastePassword);
// }

const User = mongoose.model('User', userSchema);

module.exports = User;