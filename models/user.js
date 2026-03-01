const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");

const DEFAULT_AVATAR =
  "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";

const UserSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },

  profileImage: {
    url: {
      type: String,
      default: DEFAULT_AVATAR,
    },
    filename: {
      type: String,
      default: "default-profile",
    },
  },

  skills: [{ type: String }],
  interests: [{ type: String }],
  domainTags: [{ type: String }],

  projects: [{
    type: Schema.Types.ObjectId,
    ref: "Project",
  }],

  isAdmin: {
    type: Boolean,
    default: false,
  },
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);