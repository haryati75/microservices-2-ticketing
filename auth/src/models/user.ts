import mongoose from 'mongoose';
import { Password } from '../services/password.js';

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
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
  },
  {
    // not common to include toJSON in schema options in MVC,
    // but here we do it to centralize the logic of hiding
    // sensitive info like password and changing _id to id
    // usually done in controller or service layer
    toJSON: {
      // TODO: below commented code leads totypescript complains about
      // 1) not recognizing ret.id and
      // 2) deleting non-optional properties in transform
      // transform: (doc, ret) => {
      //  ret.id = ret._id;
      //  delete ret._id;
      //  delete ret.__v;
      //  delete ret.password;
      // }
      // implement virtuals and object destructuring as an alternative to transform
      virtuals: true,
      transform(doc, ret) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { _id, __v, password, ...rest } = ret;
        return rest;
      },
    },
  },
);

// This creates an 'id' virtual that maps to '_id'
// usage in toJSON above
userSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

// Pre-save hook to hash the password
userSchema.pre('save', async function () {
  if (this.isModified('password')) {
    const hashed = await Password.toHash(this.get('password'));
    this.set('password', hashed);
  }
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
