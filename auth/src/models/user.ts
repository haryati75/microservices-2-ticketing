import mongoose from 'mongoose';

// An interface that describes the properties
// required to create a new User
interface UserAttrs {
  email: string;
  password: string;
}

// An interface that describes the properties
// that a User model has
interface UserModel extends mongoose.Model<UserDoc> {
  build(attrs: UserAttrs): UserDoc;
}

// An interface that describes the properties
// that a User Document has
interface UserDoc extends mongoose.Document {
  email: string;
  password: string;
}

// Define the User schema
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
});

// Adding a static build method to the User model
// to enforce type checking when creating a new User
// to call: User.build({ email, password });
userSchema.statics.build = (attrs: UserAttrs) => {
  return new User(attrs);
};

// Create the User model
const User = mongoose.model<UserDoc, UserModel>('User', userSchema);

export { User };
