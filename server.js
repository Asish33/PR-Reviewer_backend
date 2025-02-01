const express = require("express");
const session = require("express-session");
const passport = require("passport");
const GitHubStrategy = require("passport-github2").Strategy;
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const port = 3000;

app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: false,
    cookie: { secure: false, httpOnly: true, maxAge: 24 * 60 * 60 * 1000 },
  })
);

app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/github/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      return done(null, { profile, accessToken });
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

app.get("/auth/github", passport.authenticate("github", { scope: ["user"] }));

app.get(
  "/auth/github/callback",
  passport.authenticate("github", { failureRedirect: "/login" }),
  (req, res) => {
    res.redirect("/dashboard");
  }
);

app.get("/dashboard", (req, res) => {
  if (!req.user) {
    return res.redirect("/auth/github");
  }
  res.send(`Hello ${req.user.profile.username}! <a href="/logout">Logout</a>`);
});

app.get("/logout", (req, res) => {
  res.redirect("/");
});

app.post("/webhook", (req, res) => {
  const event = req.get("X-GitHub-Event");

  if (event == "pull_request") {
    res.json({ body: req.body });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
